import matplotlib.pyplot as plt
import torch
import torch.nn as nn
import numpy as np
import os
from args import get_parser
import pickle
from model import get_model
from torchvision import transforms
from output_utils import prepare_output
from PIL import Image
import time


data_dir = '/home/potator/PycharmProjects/spark/Inverse-Cooking-Recipe-Generation-from-Food-Images-main/inversecooking-master/data'
# code will run in gpu if available and if the flag is set to True, else it will run on cpu
use_gpu = False
device = torch.device('cuda' if torch.cuda.is_available() and use_gpu else 'cpu')
map_loc = None if torch.cuda.is_available() and use_gpu else 'cpu'

# code below was used to save vocab files so that they can be loaded without Vocabulary class
ingrs_vocab = pickle.load(open(os.path.join(data_dir, 'ingr_vocab.pkl'), 'rb'))
vocab = pickle.load(open(os.path.join(data_dir, 'instr_vocab.pkl'), 'rb'))
ingr_vocab_size = len(ingrs_vocab)
instrs_vocab_size = len(vocab)
output_dim = instrs_vocab_size


t = time.time()
import sys; sys.argv=['']; del sys
args = get_parser()
args.maxseqlen = 15
args.ingrs_only=False
model = get_model(args, ingr_vocab_size, instrs_vocab_size)
# Load the trained model parameters
model_path = os.path.join(data_dir, 'modelbest.ckpt')
model.load_state_dict(torch.load(model_path, map_location=map_loc))
model.to(device)
model.eval()
model.ingrs_only = False
model.recipe_only = False
print ('loaded model')
print ("Elapsed time:", time.time() -t)

transf_list_batch = []
transf_list_batch.append(transforms.ToTensor())
transf_list_batch.append(transforms.Normalize((0.485, 0.456, 0.406),
                                              (0.229, 0.224, 0.225)))
to_input_transf = transforms.Compose(transf_list_batch)

greedy = [True, False, False, False]
beam = [-1, -1, -1, -1]
temperature = 1.0
numgens = len(greedy)

import requests
from io import BytesIO
import random
from collections import Counter
show_anyways = False #if True, it will show the recipe even if it's not valid
image_folder = os.path.join("/home/potator/PycharmProjects/spark/Inverse-Cooking-Recipe-Generation-from-Food-Images-main/inversecooking-master/data/demo_imgs")

demo_imgs = os.listdir(image_folder)

demo_files = demo_imgs
result = ""

for img_file in demo_files:


    image_path = os.path.join(image_folder,img_file)
    image = Image.open(image_path).convert('RGB')

    transf_list = []
    transf_list.append(transforms.Resize(256))
    transf_list.append(transforms.CenterCrop(224))
    transform = transforms.Compose(transf_list)

    image_transf = transform(image)
    image_tensor = to_input_transf(image_transf).unsqueeze(0).to(device)

    plt.imshow(image_transf)
    plt.axis('off')
    plt.show()
    plt.close()

    num_valid = 1
    for i in range(1):
        with torch.no_grad():
            outputs = model.sample(image_tensor, greedy=greedy[i],
                                   temperature=temperature, beam=beam[i], true_ingrs=None)

        ingr_ids = outputs['ingr_ids'].cpu().numpy()
        recipe_ids = outputs['recipe_ids'].cpu().numpy()

        outs, valid = prepare_output(recipe_ids[0], ingr_ids[0], ingrs_vocab, vocab)
        result = result + str(outs['ingrs']) + "\n"
        if valid['is_valid'] or show_anyways:

            print('RECIPE', num_valid)
            num_valid += 1
            # print ("greedy:", greedy[i], "beam:", beam[i])

            BOLD = '\033[1m'
            END = '\033[0m'
            print(BOLD + '\nTitle:' + END, outs['title'])

            print(BOLD + '\nIngredients:' + END)
            print(', '.join(outs['ingrs']))

            print(BOLD + '\nInstructions:' + END)
            print('-' + '\n-'.join(outs['recipe']))

            print('=' * 20)

        else:
            pass

with open("/home/potator/dataset/output.txt", "w") as file:
    file.write(result)