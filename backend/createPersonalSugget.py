import sys

from pyspark.sql import SparkSession
from pyspark.sql.functions import desc,monotonically_increasing_id, col,avg,sqrt
# Create sparkSession
if __name__ == "__main__":
    database_name = "local"

    # Make a spark session to use pysaprk and also configure spark to be configured with MongoDB as follows
    spark = SparkSession.builder \
        .appName("myProject") \
        .config("spark.mongodb.input.uri", "mongodb://localhost:27017/") \
        .config("spark.mongodb.output.uri", "mongodb://localhost:27017/") \
        .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:3.0.2") \
        .config("spark.jars", "/home/potator/Downloads/mysql-connector-j-8.4.0/mysql-connector-j-8.4.0.jar") \
        .getOrCreate()

    url = "jdbc:mysql://localhost:3306/dishesdb"

    mysql_properties = {
        "user": "potator",
        "password": "212614",
        "driver": "com.mysql.jdbc.Driver"
    }
    current_user_id = sys.argv[1]

    review_df = spark.read.csv("/home/potator/Downloads/Reviews.csv", header=True).cache()

    current_user_data = review_df.filter(col("UserId") == current_user_id)

    # Tính toán vector đặc trưng cho UserId hiện tại
    current_user_features = current_user_data.groupBy("RecipeId").agg(avg("Rating").alias("Rating")).cache()

    # Tính toán khoảng cách Euclidean giữa UserId hiện tại và các UserId khác
    other_users_distances = review_df.groupBy("UserId").agg(
        sqrt(avg((col("Rating") - current_user_features.alias("cu").select("Rating").first()["Rating"]) ** 2)).alias(
            "distance")
    )

    # UserId khác có khoảng cách nhỏ nhất
    other_user_id_with_max_distance = other_users_distances.orderBy(col("distance").asc()).first()["UserId"]

    # Tìm các công thức mà UserId khác đã đánh giá trên 3 sao và UserId hiện tại chưa thử
    recommend_recipeIds = review_df.alias("r1").join(review_df.alias("r2"),
                                                     (col("r1.RecipeId") == col("r2.RecipeId")) & (
                                                                 col("r2.UserId") == current_user_id), "left_outer") \
        .filter(
        (col("r1.UserId") == other_user_id_with_max_distance) & (col("r1.Rating") > 3) & (col("r2.UserId").isNull())) \
            .select("r1.RecipeId").distinct()

    recipe_df = spark.read.format("mongo").option("uri", "mongodb://localhost:27017/local.notice_me.json").load()
    recommend_recipes = recipe_df.join(recommend_recipeIds, "RecipeId", "inner")
    recommend_recipes.write.format("mongo").option("uri", "mongodb://localhost:27017/local.personalSuggest").mode(
        "overwrite").save()

    # df = spark.read.format("mongo").option("uri", "mongodb://localhost:27017/local.personalSuggest").load()
    # df = df.withColumn("index", monotonically_increasing_id())
    # df2 = spark.read.format("mongo").option("uri", "mongodb://localhost:27017/local.result.json").load()
    # df = df.alias("df")
    # df2 = df2.alias("df2")
    #
    # # Perform the join
    # result = df.join(df2, df.RecipeId == df2.RecipeId)
    # # Order by a specific totalRatings column
    # result = result.orderBy(("df.index"))
    # # Show the result
    # result.write.format("mongo").option("uri", "mongodb://localhost:27017/local.personal&result").mode(
    #     "overwrite").save()

