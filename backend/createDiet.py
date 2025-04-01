from pyspark.sql import SparkSession
from pyspark.sql.functions import col, rand, desc, asc,monotonically_increasing_id
from pyspark.sql.types import *
import sys
import mysql.connector

input_uri = "mongodb://localhost:27017/local.notice_me.json"
output_uri = "mongodb://localhost:27017/local.personalDiet"

mydb = mysql.connector.connect(
  host="localhost",
  user="potator",
  password="212614",
  database="dishesdb"
)

if __name__ == "__main__":
    spark = SparkSession.builder \
        .appName("myProject") \
        .config("spark.mongodb.input.uri", input_uri) \
        .config("spark.mongodb.output.uri", output_uri) \
        .config("spark.sql.debug.maxToStringFields", 1000) \
        .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:3.0.2") \
        .getOrCreate()
    df = spark.read.format("mongo").load()
    # df.show()
    mycursor = mydb.cursor()
    userID = int(sys.argv[1])
    criteria = sys.argv[2]
    temp = sys.argv[3]
    ascending = True
    if (temp == 'False'):
        ascending = False
    print(ascending)
    print(type(criteria))
    mycursor.execute("SELECT * FROM info WHERE UserID = {}".format(userID))
    userData = mycursor.fetchone()
    age = userData[1]
    gender = userData[4]
    weight = userData[2]
    height = userData[3]/10
    activity_level = userData[5]

    activity_levels = {
        "Sedentary": 1.2,
        "Lightly active": 1.375,
        "Moderately active": 1.55,
        "Very active": 1.725,
        "Extremely active": 1.9
    }

    BMI = height / (weight ** 2)
    BMR = 0
    if gender == 'male':
        BMR = 88.362 + 13.397 * weight + 479.9 * height - 5.677 * age
    else:
        BMR = 447.593 + 9.247 * weight + 309.8 * height - 4.330 * age

    TDEE = BMR * activity_levels[activity_level]

    lower_calories = 0
    upper_calories = 10000000
    if BMI < 18.5:
        lower_calories = TDEE
    elif 18.5 <= BMI <= 24.9:
        lower_calories = TDEE - 200
        upper_calories = TDEE + 200
    else:
        upper_calories = TDEE

    num_meals = 5
    lower_calorie_per_meal = lower_calories / num_meals
    upper_calorie_per_meal = upper_calories / num_meals

    # Lọc dataframe một lần
    filtered_df = df.filter((df.Calories >= lower_calorie_per_meal) &
                            (df.Calories <= upper_calorie_per_meal))

    # Kiểm tra xem có đủ món ăn không
    if filtered_df.count() < num_meals:
        schema = StructType([])  # Empty schema for a null DataFrame
        # Create an empty DataFrame with the specified schema
        df = spark.createDataFrame([], schema)


    def sort_by_criteria(df):
        if criteria == 'Random':
            return df.orderBy(rand())
        if ascending:
            print("asc")
            return df.orderBy(asc(criteria))
        print("desc")
        return df.orderBy(desc(criteria))


    # Chọn ngẫu nhiên các món ăn cho mỗi loại bữa ăn
    selected_breakfast = sort_by_criteria(
        filtered_df.filter(col('MealType').contains('Breakfast'))).collect()
    selected_lunch = sort_by_criteria(filtered_df.filter(col('MealType').contains('Lunch'))).collect()
    selected_dinner = sort_by_criteria(
        filtered_df.filter(col('MealType').contains('Dinner'))).collect()
    other_lunch = sort_by_criteria(filtered_df.filter(col('MealType').contains('Other'))).collect()
    dessert_dinner = sort_by_criteria(
        filtered_df.filter(col('MealType').contains('Dessert'))).collect()

    result_rows = []

    for i in range(3):
        result_rows.append(selected_breakfast[i])
        result_rows.append(selected_lunch[i])
        result_rows.append(other_lunch[i])
        result_rows.append(selected_dinner[i])
        result_rows.append(dessert_dinner[i])

    result_df = spark.createDataFrame(result_rows, df.schema)
    result_df = result_df.withColumn("index", monotonically_increasing_id())
    # result_df.show()
    result_df.write.format("mongo").mode("overwrite").save()
    mydb.close()