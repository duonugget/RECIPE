import pandas as pd
import numpy as np
import sys
import mysql.connector
from pymongo import MongoClient


if __name__ == "__main__":
    user_id = int(sys.argv[1])
    client = MongoClient('mongodb://localhost:27017/')  # Adjust the connection string as needed

    # Select the database
    db = client['local']

    # Select the collection
    collection = db['notice_me.json']
    output = db['personalSuggest']
    mydb = mysql.connector.connect(
        host="localhost",
        user="potator",
        password="212614",
        database="dishesdb"
    )

    # input_uri = "mongodb://localhost:27017/local.notice_me.json"
    # output_uri = "mongodb://localhost:27017/local.personalDiet"

    # spark = SparkSession.builder \
    #         .appName("myProject") \
    #         .config("spark.mongodb.input.uri", input_uri) \
    #         .config("spark.mongodb.output.uri", output_uri) \
    #         .config("spark.sql.debug.maxToStringFields", 1000) \
    #         .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:3.0.2") \
    #         .getOrCreate()
    #
    #
    # df = spark.read.format("mongo").load()

    user_df = pd.read_sql("SELECT * FROM REVIEWS", mydb)
    df = pd.DataFrame(list(collection.find()))

    user_df = user_df.head(30000)
    utility_matrix = user_df.pivot_table(index='UserId', columns='RecipeId', values='Rating').fillna(0)


    def euclidean_distance(vector1, vector2):
        # Tính khoảng cách Euclid giữa hai vector.
        return np.sqrt(np.sum((vector1 - vector2) ** 2))


    def suggest_recipes(user_id, utility_matrix, user_df, df, n=100, min_similar_users=5, min_ratings=1):
        # Gợi ý công thức cho người dùng dựa trên khoảng cách Euclid.
        if user_id not in utility_matrix.index:
            raise ValueError(f"User ID {user_id} không có trong dữ liệu.")

        # Lấy vector của user hiện tại
        user_vector = utility_matrix.loc[user_id]

        # Tính khoảng cách Euclid giữa user hiện tại và các user khác
        distances = utility_matrix.apply(lambda x: euclidean_distance(user_vector, x), axis=1)

        # Loại bỏ user hiện tại ra khỏi danh sách
        distances = distances.drop(user_id)

        # Sắp xếp khoảng cách từ nhỏ đến lớn
        sorted_distances = distances.sort_values()

        # Danh sách gợi ý
        suggestions = []

        # Duyệt qua các user gần nhất để lấy gợi ý
        similar_users_count = 0
        for nearest_user_id in sorted_distances.index:
            if similar_users_count >= min_similar_users and len(suggestions) >= n:
                break
            # Lấy các công thức mà nearest_user đã đánh giá
            nearest_user_ratings = utility_matrix.loc[nearest_user_id]

            # Chỉ xem xét người dùng có đủ số lượng đánh giá
            if nearest_user_ratings[nearest_user_ratings > 0].count() >= min_ratings:
                similar_users_count += 1
                # Lọc ra những công thức mà user hiện tại chưa thử
                new_suggestions = nearest_user_ratings[nearest_user_ratings > 0].index.difference(
                    user_vector[user_vector > 0].index)

                # Thêm vào danh sách gợi ý
                for recipe_id in new_suggestions:
                    if recipe_id not in suggestions:
                        suggestions.append(recipe_id)
                        if len(suggestions) >= n:
                            break

            result = pd.DataFrame()
            for recipe_id in suggestions:
                rows = df.loc[df['RecipeId'] == recipe_id]
                result = pd.concat([result, rows])

        return result
    result = suggest_recipes(user_id, utility_matrix, user_df, df)
    result.reset_index(inplace=True)
    data_dict = result.to_dict("records")
    output.delete_many({})
    output.insert_many(data_dict)

# # # Tạo ma trận utility
# utility_matrix = user_df.pivot_table(index='UserId', columns='RecipeId', values='Rating').fillna(0)
#
# def euclidean_distance(vector1, vector2):
#     #Tính khoảng cách Euclid giữa hai vector.
#     return np.sqrt(np.sum((vector1 - vector2) ** 2))
#
# def suggest_recipes(user_id, utility_matrix,user_df,df, n=100, min_similar_users=5, min_ratings=1):
#     # Gợi ý công thức cho người dùng dựa trên khoảng cách Euclid.
#     if user_id not in utility_matrix.index:
#         raise ValueError(f"User ID {user_id} không có trong dữ liệu.")
#
#     # Lấy vector của user hiện tại
#     user_vector = utility_matrix.loc[user_id]
#
#     # Tính khoảng cách Euclid giữa user hiện tại và các user khác
#     distances = utility_matrix.apply(lambda x: euclidean_distance(user_vector, x), axis=1)
#
#     # Loại bỏ user hiện tại ra khỏi danh sách
#     distances = distances.drop(user_id)
#
#     # Sắp xếp khoảng cách từ nhỏ đến lớn
#     sorted_distances = distances.sort_values()
#
#     # Danh sách gợi ý
#     suggestions = []
#
#     # Duyệt qua các user gần nhất để lấy gợi ý
#     similar_users_count = 0
#     for nearest_user_id in sorted_distances.index:
#         if similar_users_count >= min_similar_users and len(suggestions) >= n:
#             break
#         # Lấy các công thức mà nearest_user đã đánh giá
#         nearest_user_ratings = utility_matrix.loc[nearest_user_id]
#
#         # Chỉ xem xét người dùng có đủ số lượng đánh giá
#         if nearest_user_ratings[nearest_user_ratings > 0].count() >= min_ratings:
#             similar_users_count += 1
#             # Lọc ra những công thức mà user hiện tại chưa thử
#             new_suggestions = nearest_user_ratings[nearest_user_ratings > 0].index.difference(user_vector[user_vector > 0].index)
#
#             # Thêm vào danh sách gợi ý
#             for recipe_id in new_suggestions:
#                 if recipe_id not in suggestions:
#                     suggestions.append(recipe_id)
#                     if len(suggestions) >= n:
#                         break
#
#         suggest_id = []
#         for recipe_id in suggestions:
#           id_value = user_df.loc[user_df['recipe_id'] == recipe_id, 'id'].values
#           if len(id_value) > 0:
#             suggest_id.append(id_value[0])
#
#         result = pd.DataFrame()
#         for recipe_id in suggest_id:
#           rows = df.loc[df['RecipeId'] == recipe_id]
#           result = pd.concat([result, rows])
#
#     return result
#
# user_id = int(input("Nhập user_id: "))
# result = suggest_recipes(user_id, utility_matrix,user_df,df)
# print(result)