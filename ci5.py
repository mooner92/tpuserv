import argparse
import os
import time
from PIL import Image
import numpy as np
from pycoral.adapters import classify
from pycoral.adapters import common
from pycoral.utils.dataset import read_label_file
from pycoral.utils.edgetpu import make_interpreter

Image.MAX_IMAGE_PIXELS = None  # 경고 없이 모든 크기의 이미지를 처리
def main():
    parser = argparse.ArgumentParser(formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument('-m', '--model', required=True, help='File path of .tflite file.')
    parser.add_argument('-d', '--directory', required=True, help='Directory of images to classify.')
    parser.add_argument('-l', '--labels', required=True, help='File path of labels file.')
    parser.add_argument('-k', '--top_k', type=int, default=1, help='Max number of classification results')
    parser.add_argument('-t', '--threshold', type=float, default=0.0, help='Classification score threshold')
    args = parser.parse_args()

    labels = read_label_file(args.labels)
    interpreter = make_interpreter(args.model)
    interpreter.allocate_tensors()

    size = common.input_size(interpreter)

    # List all image files in the directory
    image_files = [os.path.join(args.directory, f) for f in os.listdir(args.directory) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    sec = 0.0
    # Process each image
    for image_path in image_files:
        image = Image.open(image_path).convert('RGB').resize(size, Image.Resampling.LANCZOS)
        common.set_input(interpreter, image)
        start_time = time.perf_counter()
        interpreter.invoke()
        inference_time = time.perf_counter() - start_time
        classes = classify.get_classes(interpreter, args.top_k, args.threshold)
        sec += inference_time*1000
        # print(f'Inference time for {os.path.basename(image_path)}: {inference_time * 1000:.1f}ms')
        # for c in classes:
        #     print(f'{os.path.basename(image_path)}: {labels.get(c.id, "Unknown")} {c.score:.5f}')
    print(f"Total inference time: {sec:.1f}ms")
    print(f"Average inference time: {sec/len(image_files):.1f}ms")
if __name__ == '__main__':
    main()
