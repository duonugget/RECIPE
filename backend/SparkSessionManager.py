from pyspark.sql import SparkSession

if __name__ == "__main__":
    spark = SparkSession.getActiveSession()
    if (spark):
        print("yes")
    else:
        print("no")