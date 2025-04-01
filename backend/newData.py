from pyspark.sql import SparkSession
from pyspark.sql.functions import col, udf,when
from pyspark.sql.types import *
import sys
import json


input_uri = "mongodb://localhost:27017/local.notice_me.json"
output_uri = "mongodb://localhost:27017/local.result.json"
# jsonfile = open('/home/potator/Documents/recipes_cleaned.json', 'w')
#
# fieldnames = ("RecipeId","Name,AuthorId","AuthorName","TotalTime","DatePublished","Images","RecipeIngredientParts","Calories,FatContent","SaturatedFatContent","CholesterolContent","SodiumContent","CarbohydrateContent","FiberContent","SugarContent","ProteinContent","RecipeInstructions")
# reader = csv.DictReader(csvfile, fieldnames)
# for row in reader:
#     json.dump(row, jsonfile)
#     jsonfile.write('\n')


if __name__ == "__main__":
    spark = SparkSession.builder \
        .appName("myProject") \
        .config("spark.mongodb.input.uri", input_uri) \
        .config("spark.mongodb.output.uri", output_uri) \
        .config("spark.sql.debug.maxToStringFields", 1000) \
        .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:3.0.2") \
        .getOrCreate()
    # code use to clean csv
    # def cleanTotalTime(time):
    #     if time is None:
    #         return "null"
    #     realTime = ""
    #     for character in time:
    #         if (character.isnumeric()):
    #             realTime = realTime + character
    #
    #     if len(realTime) <= 2:
    #         return realTime + " minutes"
    #     else:
    #         result = realTime[:-2] + " hours and " + realTime[-2:] + " minutes"
    #         return result
    # def strToList(string):
    #     if string is None:
    #         return None
    #     if (string.startswith("c")):
    #         string = string[2:-1]
    #     else :
    #         string = string[1:-1]
    #     list1 = string.split("\",")
    #     for i in range(len(list1)):
    #         list1[i] = list1[i].strip()
    #         if list1[i].startswith('\"'):
    #             list1[i] = list1[i][1:]
    #         if list1[i].endswith("\""):
    #             list1[i] = list1[i][:-1]
    #     return list1
    #
    #
    # def datetime_to_string(dt):
    #     return dt.strftime('%Y-%m-%d %H:%M:%S') if dt is not None else None
    #
    # # Register UDF
    # datetime_to_string_udf = udf(datetime_to_string, StringType())
    #
    # str_list = udf(strToList, ArrayType(StringType()))
    #
    # cleanFunc = udf(cleanTotalTime, StringType())
    #
    # df = spark.read.csv("/home/potator/Downloads/archive/recipes.csv", header=True, inferSchema=True, multiLine=True,escape='"')
    # df = df.filter(df.Images != "character(0)")
    # df = df[df.RecipeIngredientParts != 'character(0)']
    # df = df.withColumn("DatePublished", datetime_to_string_udf("DatePublished"))
    # df = df.withColumn("RecipeIngredientParts", str_list("RecipeIngredientParts"))
    # df = df.withColumn("Images", str_list("Images"))
    # df = df.withColumn("Keywords", str_list("Keywords"))
    # df = df.withColumn("RecipeIngredientQuantities", str_list("RecipeIngredientQuantities"))
    # df = df.withColumn("RecipeInstructions", str_list("RecipeInstructions"))
    # df = df.withColumn("CookTime", cleanFunc("CookTime"))
    # df = df.withColumn("TotalTime", cleanFunc("TotalTime"))
    # df = df.withColumn("PrepTime", cleanFunc("PrepTime"))
    # df = df.withColumn("MealType",
    #                    when(df["RecipeCategory"].isin(
    #                        ["Breakfast", "Pancake", "Danish", "Bagels", "Scones", "Oatmeal", "Breakfast Eggs"]),
    #                         "Breakfast")
    #                    .when(df["RecipeCategory"].isin(
    #                        ["Lunch/Snacks", "Sandwiches", "Wrap", "Salad", "Soup", "Pasta", "Rice", "Pot Pie",
    #                         "Stir Fry", "Macaroni And Cheese"]), "Lunch")
    #                    .when(df["RecipeCategory"].isin(
    #                        ["Dinner", "Casserole", "Stew", "Roast Beef", "Roast", "Pot Roast", "Meatloaf", "Curries",
    #                         "Steak", "Chicken", "Duck", "Turkey Breasts", "Whole Chicken", "Whole Duck", "Whole Turkey",
    #                         "Beef Liver", "Chicken Thigh & Leg", "Chicken Breast", "Duck Breasts",
    #                         "Ham And Bean Soup"]), "Dinner")
    #                    .when(df["RecipeCategory"].isin(
    #                        ["Dessert", "Cheesecake", "Pie", "Ice Cream", "Bread Pudding", "Jellies", "Cookies",
    #                         "Chocolate Chip Cookies", "Drop Cookies", "Bar Cookie", "Short Grain Rice", "Quick Breads",
    #                         "Yeast Breads", "Sourdough Breads", "Sweet", "Chutneys", "Sauces", "Salad Dressings",
    #                         "Chocolates", "Candy", "Gelatin", "Jams"]), "Dessert")
    #                    .otherwise("Other"))
    # df = df.drop('CookTime')
    # df = df.drop('PrepTime')
    # df = df.drop('AggregatedRating')
    # df = df.drop('ReviewCount')
    # df = df.drop('RecipeYield')
    # df = df.drop('Keywords')
    #
    # df = df[df.RecipeId != 2886]
    # df = df[df.Calories != 0]
    #
    # df = df[df.Images.isNotNull()]
    # df = df[df.RecipeCategory.isNotNull()]
    # df = df[df.RecipeServings.isNotNull()]
    # df.write.format("mongo").mode("overwrite").save()
    # data_list = df.collect()
    # json_list = [row.asDict() for row in data_list]

    # Specify the output path
    # output_path = "/home/potator/Downloads/cooking-main/notice_me.json"
    #
    # # Write the list of dictionaries to a JSON file
    # with open(output_path, 'w', encoding='utf-8') as json_file:
    #     json.dump(json_list, json_file, indent=4)


    #code to search recipe
    arg1 = sys.argv[1]
    random_ingredients = arg1.split(",")


    def similarity(random_ingredients):
        def _similarity(ingredients):
            count = 0
            for userIngre in random_ingredients:
                for ingredient in ingredients:
                    if userIngre in ingredient:
                        count += 1
                        break
            return count
        return _similarity

    similarity_udf = udf(similarity(random_ingredients), IntegerType())
    df = spark.read.format("mongo").load()

    df = df.withColumn("count", similarity_udf("RecipeIngredientParts"))
    df = df.filter(col("count") == len(random_ingredients)).sort("count", ascending=False)

    df.write.format("mongo").mode("overwrite").save()

    # data_list = df.collect()
    # json_list = [row.asDict() for row in data_list]
    #
    # # Specify the output path
    # output_path = "/home/potator/Documents/result.json"
    #
    # # Write the list of dictionaries to a JSON file
    # with open(output_path, 'w', encoding='utf-8') as json_file:
    #     json.dump(json_list, json_file, indent=4)

    df.unpersist()