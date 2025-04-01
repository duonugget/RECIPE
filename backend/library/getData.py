import pandas as pd
import pymongo
from pymongo import MongoClient
import re
client = MongoClient("mongodb://127.0.0.1:27017/")
databases = client.list_database_names()
print("Databases:", databases)

books = pd.read_json("https://raw.githubusercontent.com/ozlerhakan/mongodb-json-files/master/datasets/books.json", lines=True)
print(books)


def clean_isbn(data):
  val=re.sub(r'[^0-9]', '', str(data))
  return val

books['isbn'].astype(str)
books['isbn']=books['isbn'].apply(clean_isbn)

books['available_copies'] = 15
books['borrowed_copies'] = 0

import math

db = client['mid_term']
collection = db['books']

books_list = []

for index, row in books.iterrows():
  book = {
    'title': row['title'],
    'isbn': row['isbn'],
    'authors': row['authors'],
    'categories': row['categories'],
    'status': row['status'],
    'available_copies': row['available_copies'],
    'borrowed_copies': row['borrowed_copies'],
    'ratings': []
  }

  # optional attributes and can be nan
  if not math.isnan(row['pageCount']):
    book['page_count'] = row['pageCount']
  if isinstance(row['publishedDate'], dict):
    mongo_date = row['publishedDate']['$date']
    year = int(mongo_date[0:4])
    book['published_year'] = year
  if isinstance(row['thumbnailUrl'], str):
    book['thumbnail_url'] = row['thumbnailUrl']
  if isinstance(row['shortDescription'], str):
    book['short_description'] = row['shortDescription']
  if isinstance(row['longDescription'], str):
    book['long_description'] = row['longDescription']

  books_list.append(book)

collection.insert_many(books_list)
