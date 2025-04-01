from pyspark.sql import SparkSession
from pyspark.sql.functions import desc,monotonically_increasing_id
# Create sparkSession
if __name__ == "__main__":
    database_name = "local"

    # Make a spark session to use pysaprk and also configure spark to be configured with MongoDB as follows
    spark = SparkSession.builder \
        .appName("myProject") \
        .config("spark.mongodb.input.uri", "mongodb://localhost:27017/") \
        .config("spark.mongodb.output.uri", "mongodb://localhost:27017/") \
        .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:3.0.2") \
        .getOrCreate()

    df = spark.read.format("mongo").option("uri", "mongodb://localhost:27017/local.personalSuggest").load()
    df1 = spark.read.format("mongo").option("uri", "mongodb://localhost:27017/local.trending").load()
    # df = df.withColumn("index", monotonically_increasing_id())
    df2 = spark.read.format("mongo").option("uri", "mongodb://localhost:27017/local.result.json").load()
    df = df.alias("df")
    df1 = df1.alias("df1")
    df2 = df2.alias("df2")

    # Perform the join
    temp_resullt = df.join(df1, "RecipeId")
    result = temp_resullt.join(df2, "RecipeId").orderBy(desc("totalRatings"))

    result.write.format("mongo").option("uri", "mongodb://localhost:27017/local.personal&trending&result").mode(
        "overwrite").save()

