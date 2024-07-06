#!/bin/bash

# 프로그램 이름
PROGRAM_NAME="NerdyOps-Agent"

# 빌드할 대상 플랫폼 및 아키텍처 목록
PLATFORMS=(
    "windows/386"
    "darwin/amd64"
    "darwin/arm64"
    "linux/amd64"
    "linux/386"
    "linux/arm"
    "linux/arm64"
    "freebsd/amd64"
    "freebsd/386"
)

# 빌드 함수
build() {
    local OSARCH=$1
    IFS="/" read -r -a OSARCH_ARRAY <<< "$OSARCH"
    local GOOS=${OSARCH_ARRAY[0]}
    local GOARCH=${OSARCH_ARRAY[1]}
    local OUTPUT_FILE="${PROGRAM_NAME}-${GOOS}-${GOARCH}"
    local ARCHIVE_FILE

    # Windows의 경우 .exe 확장자 추가 및 zip 압축 사용
    if [ "$GOOS" = "windows" ]; then
        OUTPUT_FILE+=".exe"
        ARCHIVE_FILE="../../backend/downloads/${OUTPUT_FILE}.zip"
    else
        ARCHIVE_FILE="../../backend/downloads/${OUTPUT_FILE}.tar.gz"
    fi
    
    echo "Building for $GOOS/$GOARCH..."
    GOOS=$GOOS GOARCH=$GOARCH go build -o $OUTPUT_FILE
    if [ $? -ne 0 ]; then
        echo "Error: Failed to build for $GOOS/$GOARCH"
        exit 1
    fi

    echo "Compressing $OUTPUT_FILE..."
    if [ "$GOOS" = "windows" ]; then
        # zip 압축
        zip $ARCHIVE_FILE $OUTPUT_FILE
        if [ $? -ne 0 ]; then
            echo "Error: Failed to create archive $ARCHIVE_FILE"
            exit 1
        fi
    else
        # tar.gz 압축
        tar -czvf $ARCHIVE_FILE $OUTPUT_FILE
        if [ $? -ne 0 ]; then
            echo "Error: Failed to create archive $ARCHIVE_FILE"
            exit 1
        fi
    fi
    
    # 빌드된 파일 삭제
    rm $OUTPUT_FILE
}

# 모든 플랫폼에 대해 빌드 수행
for PLATFORM in "${PLATFORMS[@]}"; do
    build $PLATFORM
done

echo "All builds and archives completed successfully."
