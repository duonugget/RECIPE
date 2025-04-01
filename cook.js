// Define the findfood function

const findfood = async () => {
    try {
        const response = await fetch('./baking/baking.json', {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        let userInput = document.querySelector('#cook').value.trim().toLowerCase();
        userInput = userInput.split(',')
        console.log(userInput)

        // Tạo một chuỗi dữ liệu
        const data1 = userInput.join('');
        console.log(data1)
        // Tạo một đối tượng Blob từ chuỗi dữ liệu
        const blob = new Blob([data1], { type: 'text/plain' });

        // Tạo một đối tượng URL từ Blob
        const url = window.URL.createObjectURL(blob);

        // Tạo một thẻ a để tạo ra liên kết tải xuống
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ten_file.txt'; // Tên file bạn muốn lưu
        a.textContent = 'Tải xuống';

        document.body.appendChild(a);
        userInput.forEach(userInput => {
            userInput = userInput.trim();
            let matchingRecipes = data.filter(recipe => {
                const ingredients = recipe.ingredients.join(' ').toLowerCase();
                return ingredients.includes(userInput)
            });


            const resultContainer = document.querySelector('#results');
            resultContainer.innerHTML = '';


            if (matchingRecipes.length > 0) {
                const list = document.createElement('ol');
                matchingRecipes.forEach(recipe => {
                    const item = document.createElement('li');


                    const nameItem = document.createElement('span');
                    nameItem.textContent = recipe.name;
                    item.appendChild(nameItem);


                    const ingredientsList = document.createElement('ul');
                    recipe.ingredients.forEach(ingredient => {
                        const ingredientItem = document.createElement('li');
                        ingredientItem.textContent = ingredient;
                        ingredientsList.appendChild(ingredientItem);
                    });
                    item.appendChild(ingredientsList);

                    const image = document.createElement('img');
                    image.src = recipe.image;
                    image.alt = recipe.name;
                    image.style.width = '200px';
                    image.style.height = '200px';
                    image.style.objectFit = 'cover';
                    image.style.borderRadius = '100px';
                    item.appendChild(image);

                    const urlItem = document.createElement('a');
                    urlItem.href = recipe.url;
                    urlItem.textContent = 'Recipe URL';
                    item.appendChild(urlItem);


                    list.appendChild(item);
                });
                resultContainer.appendChild(list);
            } else {
                resultContainer.textContent = 'No matching recipes found.';
            }


            matchingRecipes = data
            resultContainer = document.querySelector('#results');
            resultContainer.innerHTML = '';


            if (matchingRecipes.length > 0) {
                const list = document.createElement('ol');
                matchingRecipes.forEach(recipe => {
                    const item = document.createElement('li');


                    const nameItem = document.createElement('span');
                    nameItem.textContent = recipe.name;
                    item.appendChild(nameItem);


                    const ingredientsList = document.createElement('ul');
                    recipe.ingredients.forEach(ingredient => {
                        const ingredientItem = document.createElement('li');
                        ingredientItem.textContent = ingredient;
                        ingredientsList.appendChild(ingredientItem);
                    });
                    item.appendChild(ingredientsList);

                    const image = document.createElement('img');
                    image.src = recipe.image;
                    image.alt = recipe.name;
                    image.style.width = '200px';
                    image.style.height = '200px';
                    image.style.objectFit = 'cover';
                    image.style.borderRadius = '100px';
                    item.appendChild(image);

                    const urlItem = document.createElement('a');
                    urlItem.href = recipe.url;
                    urlItem.textContent = 'Recipe URL';
                    item.appendChild(urlItem);


                    list.appendChild(item);
                });
                resultContainer.appendChild(list);
            } else {
                resultContainer.textContent = 'No matching recipes found.';
            }
        });
    } catch (error) {
        console.error('Error:', error);
    }
};





document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('form').addEventListener('submit', function (event) {
        event.preventDefault();
        findfood();
    });
});
