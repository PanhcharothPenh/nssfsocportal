import sys
import os

async def app(scope, receive, send):
    assert scope['type'] == 'http'
    
    import_error = None
    tb = ""
    try:
        # Ensure api directory is in sys.path
        api_dir = os.path.dirname(os.path.abspath(__file__))
        if api_dir not in sys.path:
            sys.path.insert(0, api_dir)
            
        # Try to import the real app
        from app import app as real_app
        
        # Delegate ASGI request to the real app
        await real_app(scope, receive, send)
        return
    except Exception as e:
        import_error = str(e)
        import traceback
        tb = traceback.format_exc()

    # Fallback JSON response containing the traceback
    response_body = f'{{"status": "error", "message": "Import failed on serverless startup", "error": {repr(import_error)}, "traceback": {repr(tb)}}}'.encode('utf-8')
    
    await send({
        'type': 'http.response.start',
        'status': 500,
        'headers': [
            [b'content-type', b'application/json; charset=utf-8'],
            [b'content-length', str(len(response_body)).encode('utf-8')]
        ]
    })
    await send({
        'type': 'http.response.body',
        'body': response_body,
    })
