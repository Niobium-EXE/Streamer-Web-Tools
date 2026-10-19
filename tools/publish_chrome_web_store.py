#!/usr/bin/env python3
"""Submit an existing Chrome Web Store item via Google's API v2.

Reads a service-account JSON from the GitHub Actions secret environment.
Never logs credentials or bearer tokens.
"""
import argparse
import json
import os
from pathlib import Path
import re
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
import zipfile

SCOPE = 'https://www.googleapis.com/auth/chromewebstore'
BASE = 'https://chromewebstore.googleapis.com'


def api_request(url, access_token, method='GET', payload=None, content_type=None):
    headers = {'Authorization': f'Bearer {access_token}'}
    if content_type:
        headers['Content-Type'] = content_type
    request = Request(url, data=payload, headers=headers, method=method)
    try:
        with urlopen(request, timeout=120) as response:
            content = response.read().decode('utf-8')
    except HTTPError as error:
        # Server errors may contain diagnostic JSON, but not authentication
        # headers. Never print the original request or the bearer token.
        detail = error.read(3000).decode('utf-8', 'replace')
        raise RuntimeError(f'Chrome Web Store API HTTP {error.code}: {detail}') from None
    except URLError as error:
        raise RuntimeError(f'Unable to reach Chrome Web Store API: {error.reason}') from None
    return json.loads(content) if content.strip() else {}


def validate_id(value, field):
    if not re.fullmatch(r'[a-zA-Z0-9_-]+', value):
        raise ValueError(f'{field} is missing or has invalid characters.')
    return value


def run(archive, publisher_id, extension_id, secret):
    validate_id(publisher_id, 'CWS_PUBLISHER_ID')
    validate_id(extension_id, 'CWS_EXTENSION_ID')
    if not secret:
        raise ValueError('Missing CWS_SERVICE_ACCOUNT_JSON GitHub Actions secret.')
    archive = Path(archive)
    with zipfile.ZipFile(archive) as z:
        manifest = json.loads(z.read('manifest.json'))
        assert 'key' not in manifest and 'update_url' not in manifest, 'Store ZIP must not contain a self-hosted update key or URL.'
    version = manifest['version']

    from google.oauth2 import service_account
    from google.auth.transport.requests import Request as GoogleAuthRequest
    info = json.loads(secret)
    if info.get('type') != 'service_account':
        raise ValueError('CWS_SERVICE_ACCOUNT_JSON must be a Google service account JSON key.')
    credentials = service_account.Credentials.from_service_account_info(info, scopes=[SCOPE])
    credentials.refresh(GoogleAuthRequest())

    item = f'publishers/{publisher_id}/items/{extension_id}'
    status_url = f'{BASE}/v2/{item}:fetchStatus'
    upload_url = f'{BASE}/upload/v2/{item}:upload'
    publish_url = f'{BASE}/v2/{item}:publish'

    print(f'Uploading v{version} to existing Chrome Web Store item {extension_id}…', flush=True)
    result = api_request(upload_url, credentials.token, method='POST',
                         payload=archive.read_bytes(), content_type='application/zip')
    state = result.get('uploadState', '')
    if state == 'IN_PROGRESS':
        for attempt in range(30):
            time.sleep(10)
            status = api_request(status_url, credentials.token)
            state = status.get('lastAsyncUploadState', '')
            print(f'Upload processing: {state or "waiting"} (check {attempt + 1}/30)', flush=True)
            if state == 'SUCCEEDED':
                break
            if state in ('FAILED', 'NOT_FOUND'):
                raise RuntimeError(f'Chrome Web Store ZIP upload did not succeed: {state}')
        else:
            raise RuntimeError('Upload processing exceeded 5 minutes. Check the Developer Dashboard before retrying.')
    elif state != 'SUCCEEDED':
        raise RuntimeError(f'Unexpected Web Store upload state {state!r}: {result}')

    print('Upload succeeded; submitting for review with automatic publication after approval…', flush=True)
    result = api_request(publish_url, credentials.token, method='POST',
                         payload=json.dumps({'publishType': 'DEFAULT_PUBLISH', 'skipReview': False}).encode('utf-8'),
                         content_type='application/json')
    print('Submission accepted by Chrome Web Store API.', flush=True)
    if result.get('warningsInfo'):
        print('Web Store returned warnings. Review the Developer Dashboard for details.', flush=True)
    print('Google review is still required. The existing Store listing and extension ID are unchanged.', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('zip', type=Path)
    args = parser.parse_args()
    run(args.zip, os.environ.get('CWS_PUBLISHER_ID', '').strip(),
        os.environ.get('CWS_EXTENSION_ID', '').strip(),
        os.environ.get('CWS_SERVICE_ACCOUNT_JSON', ''))
