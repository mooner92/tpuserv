import argparse
import time
import os
import numpy as np
from PIL import Image
from tflite_runtime.interpreter import Interpreter
from pycoral.adapters import classify
from pycoral.adapters import common
from pycoral.utils.dataset import read_label_file

Image.MAX_IMAGE_PIXELS = None  # 경고 없이 모든 크기의 이미지를 처리

def make_interpreter(model_file):
    return Interpreter(model_path=model_file)

def main():
    parser = argparse.ArgumentParser(
        formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument('-m', '--model', required=True, help='File path of .tflite file.')
    parser.add_argument('-d', '--directory', required=True, help='Directory of images to classify.')
    parser.add_argument('-l', '--labels', help='File path of labels file.')
    parser.add_argument('-k', '--top_k', type=int, default=1, help='Max number of classification results')
    parser.add_argument('-t', '--threshold', type=float, default=0.0, help='Classification score threshold')
    args = parser.parse_args()

    labels = read_label_file(args.labels) if args.labels else {}
    interpreter = make_interpreter(args.model)
    interpreter.allocate_tensors()

    size = common.input_size(interpreter)
    image_paths = [os.path.join(args.directory, f) for f in os.listdir(args.directory) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    total_time = 0

    for image_path in image_paths:
        image = Image.open(image_path).convert('RGB').resize(size, Image.Resampling.LANCZOS)
        common.set_input(interpreter, image)
        start_time = time.perf_counter()
        interpreter.invoke()
        inference_time = time.perf_counter() - start_time
        total_time += inference_time * 1000
        classes = classify.get_classes(interpreter, args.top_k, args.threshold)
        # print(f"Inference time for {os.path.basename(image_path)}: {inference_time * 1000:.1f}ms")
        # for c in classes:
        #     label = labels.get(c.id, c.id)
        #     print(f"{os.path.basename(image_path)}: {label} {c.score:.5f}")

    print(f"Total inference time: {total_time:.1f}ms")
    print(f"Average inference time: {total_time/len(image_paths):.1f}ms")

if __name__ == '__main__':
    main()
