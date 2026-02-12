# Stage 1: Build FFmpeg in Alpine
FROM alpine:latest AS ffmpeg-builder

RUN apk add --no-cache ffmpeg

# Stage 2: Add FFmpeg to n8n
FROM n8nio/n8n:latest

USER root

# Copy FFmpeg binaries and libraries from Alpine
COPY --from=ffmpeg-builder /usr/bin/ffmpeg /usr/bin/ffmpeg
COPY --from=ffmpeg-builder /usr/bin/ffprobe /usr/bin/ffprobe
COPY --from=ffmpeg-builder /lib /lib
COPY --from=ffmpeg-builder /usr/lib /usr/lib

USER node
