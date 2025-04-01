const searchBtn = document.getElementById("search-btn");
const mealList = document.getElementById("meal");
const mealDetailsContent = document.querySelector(".meal-details-content");
const recipeCloseBtn = document.getElementById("recipe-close-btn");
const mealContainer = document.querySelector(".container");

let recipesData = [];
let recipeChunks = [];
let currentChunkIndex = 0;

// Event listeners
searchBtn.addEventListener("click", getMealList);
mealList.addEventListener("click", getMealRecipe);
recipeCloseBtn.addEventListener("click", () => {
    mealDetailsContent.parentElement.classList.remove("showRecipe");
});

// Fetch recipes data
fetch('./notice_me.json')
    .then((response) => response.json())
    .then((data) => {
        recipesData = data;
        // Split recipesData into chunks of 20 recipes each
        recipeChunks = chunkArray(recipesData, 20);
        // Populate meal list with the first chunk
        getMealList();
        // Create navigation boxes
        createNavigationBoxes();
    })
    .catch((error) => {
        console.error('Error fetching local JSON file:', error);
    });

// Function to split array into chunks
function chunkArray(arr, chunkSize) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        chunks.push(arr.slice(i, i + chunkSize));
    }
    return chunks;
}

// Get meal list that matches with the ingredients
function getMealList() {
    let html = "";
    const currentChunk = recipeChunks[currentChunkIndex];
    currentChunk.forEach((recipe) => {
        html += `   
        <div class="meal-item" data-id="${recipe.RecipeId}">
            <div class="meal-img">
                <img src="${recipe.Images[0]}" alt="food">
            </div>
            <div class="meal-name">
                <h3>${recipe.Name}</h3>
                <p>${recipe.Description}</p>
                <a href="#" class="recipe-btn">Get Recipe</a>
            </div>
        </div>
        `;
    });

    mealList.innerHTML = html;
    mealList.classList.remove("notFound");
}

// Function to create navigation boxes
function createNavigationBoxes() {
    const numChunks = recipeChunks.length;
    const navigationContainer = document.createElement("div");
    navigationContainer.classList.add("navigation-boxes");

    const maxBoxes = 5; // Maximum number of boxes to show
    const firstBox = Math.max(0, currentChunkIndex - 2); // Ensure first box index is not negative
    const lastBox = Math.min(numChunks - 1, firstBox + maxBoxes - 1); // Ensure last box index is not out of bounds

    if (firstBox > 0) {
        // Show "..." if there's a gap before the first box
        const ellipsisBox = document.createElement("div");
        ellipsisBox.textContent = "...";
        ellipsisBox.classList.add("navigation-box"); // Add class to match other boxes
        ellipsisBox.addEventListener("click", () => {
            currentChunkIndex = Math.max(0, currentChunkIndex - maxBoxes + 2); // Update currentChunkIndex
            getMealList();
        });
        navigationContainer.appendChild(ellipsisBox);
    }

    for (let i = firstBox; i <= lastBox; i++) {
        const box = document.createElement("div");
        box.classList.add("navigation-box");
        box.textContent = i + 1;
        box.addEventListener("click", () => {
            currentChunkIndex = i;
            getMealList();
            updateNavigationBoxes(); // Update the numbers on the boxes after clicking
        });
        navigationContainer.appendChild(box);
    }

    if (lastBox < numChunks - 1) {
        // Show "..." if there's a gap after the last box
        const ellipsisBox = document.createElement("div");
        ellipsisBox.textContent = "...";
        ellipsisBox.classList.add("navigation-box"); // Add class to match other boxes
        ellipsisBox.addEventListener("click", () => {
            currentChunkIndex = Math.min(numChunks - 1, currentChunkIndex + maxBoxes - 2); // Update currentChunkIndex
            getMealList();
            updateNavigationBoxes(); // Update the numbers on the boxes after clicking
        });
        navigationContainer.appendChild(ellipsisBox);
    }

    mealContainer.appendChild(navigationContainer);
}

// Function to update the numbers on the navigation boxes
function updateNavigationBoxes() {
    const navigationBoxes = document.querySelectorAll(".navigation-box");
    navigationBoxes.forEach((box, index) => {
        const numChunks = recipeChunks.length;
        const firstBox = Math.max(0, currentChunkIndex - 2); // Ensure first box index is not negative
        const displayedIndex = firstBox + index;
        if (displayedIndex < numChunks) {
            box.textContent = displayedIndex + 1;
        }
    });
}

// Get recipe of the meal
function getMealRecipe(e) {
    e.preventDefault();
    if (e.target.classList.contains("recipe-btn")) {
        let mealItem = e.target.parentElement.parentElement;
        let mealId = mealItem.dataset.id;

        fetch(`http://localhost:3000/get-recipe/${mealId}`)
            .then((response) => response.json())
            .then((recipe) => {
                mealRecipeModal(recipe);
            })
            .catch((error) => {
                console.error('Error fetching recipe from local server:', error);
            });
    }
}

// Create a modal
function mealRecipeModal(meal) {
    let html = `
        <h2 class="recipe-title">${meal.Name}</h2>
        <p class="recipe-category">${meal.FoodCategory}</p>
        <div class="recipe-instruct">
            <h3>Instructions:</h3>
            <p>${meal.RecipeInstructions.join('<br>')}</p>
        </div>
        <div class="recipe-meal-img">
            <img src="${meal.Images[0]}" alt="food">
        </div>
        <div class="recipe-link">
            <a href="${meal.Images[0]}" target="_blank">View Full Recipe</a>
        </div>
    `;
    mealDetailsContent.innerHTML = html;
    mealDetailsContent.parentElement.classList.add("showRecipe");
}
