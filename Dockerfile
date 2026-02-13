# Stage 1: Get FFmpeg + ALL its dependencies from Alpine
FROM alpine:3.22 AS ffmpeg-builder
# Install ffmpeg + audio/video device dependencies
RUN apk add --no-cache ffmpeg pulseaudio-dev alsa-lib-dev

# Stage 2: Copy FFmpeg into n8n
FROM n8nio/n8n:latest

USER root

# Copy FFmpeg binaries
COPY --from=ffmpeg-builder /usr/bin/ffmpeg /usr/bin/ffmpeg
COPY --from=ffmpeg-builder /usr/bin/ffprobe /usr/bin/ffprobe

# Copy ALL shared libraries into isolated directory (won't overwrite n8n system libs)
COPY --from=ffmpeg-builder /usr/lib/ /opt/ffmpeg-libs/

# Create wrapper scripts that set LD_LIBRARY_PATH
RUN mv /usr/bin/ffmpeg /usr/bin/ffmpeg.bin && \
    mv /usr/bin/ffprobe /usr/bin/ffprobe.bin && \
    printf '#!/bin/sh\nLD_LIBRARY_PATH=/opt/ffmpeg-libs:/opt/ffmpeg-libs/pulseaudio exec /usr/bin/ffmpeg.bin "$@"\n' > /usr/bin/ffmpeg && \
    chmod +x /usr/bin/ffmpeg && \
    printf '#!/bin/sh\nLD_LIBRARY_PATH=/opt/ffmpeg-libs:/opt/ffmpeg-libs/pulseaudio exec /usr/bin/ffprobe.bin "$@"\n' > /usr/bin/ffprobe && \
    chmod +x /usr/bin/ffprobe

USER node
