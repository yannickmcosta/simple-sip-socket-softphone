# WebSocket SIP Softphone

A standalone WebRTC SIP softphone application using SIP.js and WebSocket transport.

https://yannickmcosta.github.io/simple-sip-socket-softphone/softphone.html

## Features

- WebRTC-based SIP calling
- WebSocket transport for firewall-friendly connectivity
- Full-featured user interface
- Connection diagnostics and testing
- Real-time call status and duration
- Call history tracking
- DTMF tone support
- Hold/Resume functionality
- Mute controls
- Volume controls
- Incoming call notifications
- Debug logging
- Persistent settings (localStorage)

## Quick Start

1. Open `softphone.html` in a modern web browser
2. Configure your connection settings:
   - **WebSocket Server**: Your SIP server WebSocket URL (e.g., `wss://your-server.example.com:8089/ws`)
   - **SIP User**: Your extension number
   - **Password**: Your SIP password
   - **Domain**: Your SIP domain
3. Click **Connect** to register with the server
4. Enter a phone number and click **Call**

## Server Requirements

This softphone requires a SIP server with WebSocket support, such as:

- **Asterisk** with `chan_sip` or `chan_pjsip` and WebSocket transport
- **FreeSWITCH** with WebSocket module
- Other SIP servers supporting WebSocket (RFC 7118)

### Example Asterisk Configuration

```ini
[transport-ws]
type=transport
protocol=ws
bind=0.0.0.0:8089

[transport-wss]
type=transport
protocol=wss
bind=0.0.0.0:8089
cert_file=/path/to/cert.pem
priv_key_file=/path/to/key.pem
```

## Browser Support

- Chrome/Chromium 74+
- Firefox 66+
- Safari 12+
- Edge 79+

WebRTC support is required.

## Security Considerations

- Always use `wss://` (secure WebSocket) in production
- Implement proper authentication on your SIP server
- Consider implementing SRTP for media encryption
- Validate and sanitize all user inputs
- Use HTTPS for hosting the application

## License

This project uses SIP.js library (various licenses apply). Check `sip-0.21.2.js` for details.

## Troubleshooting

### Cannot Connect

1. Verify WebSocket server is accessible
2. Check firewall rules
3. Ensure correct port (typically 8089 or 8088)
4. For `wss://`, verify SSL certificate validity

### Registration Fails

1. Verify credentials (username/password/domain)
2. Check SIP server logs
3. Ensure user is configured on the server
4. Verify authentication realm matches

### No Audio

1. Grant microphone permissions in browser
2. Check audio device selection
3. Verify STUN/TURN configuration if behind NAT
4. Check firewall allows RTP/RTCP packets

## Contributing

Contributions are welcome. Please ensure:
- Code follows existing style
- Test changes across multiple browsers
- Update documentation as needed
