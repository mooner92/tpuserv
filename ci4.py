import argparse
import time
import numpy as np
from PIL import Image
from tflite_runtime.interpreter import Interpreter
from tflite_runtime.interpreter import load_delegate
from pycoral.adapters import classify
from pycoral.adapters import common
from pycoral.utils.dataset import read_label_file

Image.MAX_IMAGE_PIXELS = None  # 경고 없이 모든 크기의 이미지를 처리
def make_interpreter(model_file):
    model_file, *device = model_file.split('@')
    if device:
        return Interpreter(
            model_path=model_file,
            experimental_delegates=[load_delegate('libedgetpu.so.1', {'device': device[0]})])
    else:
        return Interpreter(model_path=model_file)

def main():
    parser = argparse.ArgumentParser(
        formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument(
        '-m', '--model', required=True, help='File path of .tflite file.')
    parser.add_argument(
        '-i', '--input', required=True, help='Image to be classified.')
    parser.add_argument(
        '-l', '--labels', help='File path of labels file.')
    parser.add_argument(
        '-k', '--top_k', type=int, default=1,
        help='Max number of classification results')
    parser.add_argument(
        '-t', '--threshold', type=float, default=0.0,
        help='Classification score threshold')
    parser.add_argument(
        '-c', '--count', type=int, default=5,
        help='Number of times to run inference')
    parser.add_argument(
        '-a', '--input_mean', type=float, default=128.0,
        help='Mean value for input normalization')
    parser.add_argument(
        '-s', '--input_std', type=float, default=128.0,
        help='STD value for input normalization')
    args = parser.parse_args()

    labels = read_label_file(args.labels) if args.labels else {}
    st = time.perf_counter()
    interpreter = make_interpreter(args.model)
    interpreter.allocate_tensors()

    size = common.input_size(interpreter)
    image = Image.open(args.input).convert('RGB').resize(size, Image.LANCZOS)

    params = common.input_details(interpreter, 'quantization_parameters')
    scale = params['scales']
    zero_point = params['zero_points']
    mean = args.input_mean
    std = args.input_std
    normalized_input = (np.asarray(image) - mean) / (std * scale) + zero_point
    np.clip(normalized_input, 0, 255, out=normalized_input)
    common.set_input(interpreter, normalized_input.astype(np.uint8))

    #print('----INFERENCE TIME----')
    sec = 0.0
    for _ in range(args.count):
        start = time.perf_counter()
        interpreter.invoke()
        inference_time = time.perf_counter() - start
        classes = classify.get_classes(interpreter, args.top_k, args.threshold)
        sec += (inference_time * 1000)
    print('%.1fms' % sec)
    # t = (time.perf_counter() - st)
    # print('total_time : %.1fms'% t*1000)
    #print('-------RESULTS--------')
    # for c in classes:
    #     print('%s: %.5f' % (labels.get(c.id, c.id), c.score))

if __name__ == '__main__':
    main()
