ARG NODE_VERSION=21.6.0

FROM node:${NODE_VERSION}-alpine

# Install Python, Tesseract, and build dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    tesseract-ocr \
    tesseract-ocr-dev \
    gcc \
    g++ \
    libstdc++ \
    python3-dev \
    swig \
    libgomp \
    git

# Create and activate a virtual environment
RUN python3 -m venv /usr/src/venv
ENV PATH="/usr/src/venv/bin:$PATH"

# Download and install vosk model
RUN wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip && \
    unzip vosk-model-small-en-us-0.15.zip && \
    mkdir /usr/src/vosk && \
    mv vosk-model-small-en-us-0.15 /usr/src/vosk/model

# Install vosk from source
RUN git clone https://github.com/alphacep/vosk-api && \
    cd vosk-api/python && \
    python3 setup.py install

RUN pip install --upgrade pip setuptools wheel
# RUN pip install opencv-python==4.3.0.38
# RUN pip install numpy==1.26.4
# Install additional Python dependencies
RUN pip install pytesseract \
               transformers \
               translate

# Use production node environment by default.
ENV NODE_ENV production

WORKDIR /usr/src/app

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage a bind mounts to package.json and package-lock.json to avoid having to copy them into
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Run the application as a non-root user.
USER node

# Copy the rest of the source files into the image.
COPY . .

# Expose the port that the application listens on.
EXPOSE 10000

# Run the application.
CMD node index.js