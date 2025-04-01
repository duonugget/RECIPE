from pyspark.sql import SparkSession, Row
from pyspark.sql.functions import col, udf
import os
import json
from pyspark.sql.types import *
import requests
import shutil
import urllib

spark = SparkSession.builder.appName("create").getOrCreate()
df = spark.read.json("/home/potator/Documents/archive/recipes.json", multiLine=True)
df_2 = spark.read.json("/home/potator/Documents/archive/inspiration.json", multiLine=True)
df_3 = spark.read.json("/home/potator/Documents/archive/budget.json", multiLine=True)
df_4 = spark.read.json("/home/potator/Documents/archive/health.json", multiLine=True)
desert = spark.read.json("/home/potator/Documents/archive/baking.json", multiLine=True)

df = df.union(df_2)
df = df.union(df_3)
df = df.union(df_4).cache()
df.show()
breakfast = df.filter(col("dish_type").like("%Breakfast%")).select("image").collect()
lunch = df.filter(col("dish_type").like("%Lunch%")).select("image").collect()
dinner = df.filter(col("dish_type").like("%Dinner%")).select("image").collect()


def download_image(url, directory):
  """
  Downloads an image from the specified URL and saves it to the given directory.

  Args:
      url: The URL of the image to download.
      directory: The directory where the image should be saved.

  Raises:
      OSError: If the directory does not exist or cannot be created.
      Exception: If there is any other error during the download process.
  """

  # Extract the filename from the URL
  filename = os.path.basename(url)

  # Create the full path to the downloaded image
  filepath = os.path.join(directory, filename)

  # Check if the directory exists
  if not os.path.exists(directory):
    os.makedirs(directory)  # Create the directory if it doesn't exist

  try:
    # Download the image using urllib.request.urlretrieve
    urllib.request.urlretrieve(url, filepath)
    print(f"Image downloaded successfully: {filepath}")
  except Exception as e:
    print(f"Error downloading image: {e}")


desert_path = "/home/potator/Documents/desert"
lunch_path = "/home/potator/Documents/lunch"
breakfast_path = "/home/potator/Documents/breakfast"
dinner_path = "/home/potator/Documents/dinner"

desert_urls = desert.select("image").collect()
desert_collection = ""
for desert_url in desert_urls:
    download_image(desert_url[0],desert_path)

for meal in breakfast:
    download_image(meal[0], breakfast_path)

for meal in lunch:
    download_image(meal[0], lunch_path)

for meal in dinner:
    download_image(meal[0], dinner_path)
