#!/bin/bash

# 결과 파일 초기화
echo "" > tpu-res.txt
echo "" > non-tpu-res.txt

# 명령어 생성 함수
generate_command() {
    local server_url=$1
    local command="curl -v -L -H 'Accept: application/json'"

    # Add all jpg files to the command
    for file in *.jpg; do
        command+=" -F 'myFiles=@${file}'"
    done

    command+=" $server_url"
    echo "$command" # Return the complete command
}

# 10회 반복
for i in {1..5}; do
    echo "Iteration $i"

    # Generate command for TPU enabled server
    echo "Sending all .jpg files to TPU enabled server..."
    cmd=$(generate_command "http://192.168.35.202:30007/yes-tpu")
    eval "$cmd" >> tpu-res.txt
    echo "All files results saved to TPU enabled server."

    # Generate command for non-TPU server
    echo "Sending all .jpg files to non-TPU server..."
    cmd=$(generate_command "http://192.168.35.202:30008/yes-tpu")
    eval "$cmd" >> non-tpu-res.txt
    echo "All files results saved to non-TPU server."

    # Wait before the next iteration to reduce server load
    sleep 5
done

echo "All iterations completed. All files have been processed and results are saved in respective files."