const searchBtn = document.getElementById("search-btn");
const mealList = document.getElementById("meal");
const mealDetailsContent = document.querySelector(".meal-details-content");
const recipeCloseBtn = document.getElementById("recipe-close-btn");
const mealContainer = document.querySelector(".container");
const loadingScreen = document.getElementById("loading-screen");
const stars = document.querySelectorAll('.stars i');
const starsNone = document.querySelector('.rating-box');
const userID = 1;

const sortButton = document.getElementById('dropdownBtnSort');
const dropdownSortOptions = document.getElementById('dropdownSortOptions');
const sortOptions = document.querySelectorAll('.sortOption');

const queryButton = document.getElementById('dropdownBtnQuery');
const dropdownQueryOptions = document.getElementById('dropdownQueryOptions');
const queryOptions = document.querySelectorAll('.queryOption');

const filterButton = document.getElementById('dropdownBtnFilter');
const dropdownFilterOptions = document.getElementById('dropdownFilterOptions');
const filterOptions = document.querySelectorAll('.filterOption');

const toggleButton = document.getElementById('toggleWrapperBtn');
const selectionWrapper = document.getElementById('selectionWrapper');

toggleButton.addEventListener('click', () => {
    if (selectionWrapper.style.display === 'none' || selectionWrapper.style.display === '') {
        selectionWrapper.style.display = 'block';
        toggleIcon.classList.remove('fa-chevron-down');
        toggleIcon.classList.add('fa-chevron-up');
    } else {
        selectionWrapper.style.display = 'none';
        toggleIcon.classList.remove('fa-chevron-up');
        toggleIcon.classList.add('fa-chevron-down');
    }
})

dropdownQueryOptions.style.display = "none";
dropdownSortOptions.style.display = "none";
dropdownFilterOptions.style.display = "none";

let queryType = '';
let lastQuery = '?';
let sortType = '';
let filterType = '';


function toggleButtonAsOption(button, buttonType, styleVariable, activeColor, inactiveColor) {
    button.classList.toggle('selected'); // Toggle the 'selected' class

    if (button.classList.contains('selected')) {
        button.style.setProperty(styleVariable, activeColor); // Highlight if selected
        buttonType += button.textContent.trim(); // Add button text to type if selected
    } else {
        button.style.setProperty(styleVariable, inactiveColor); // Reset if deselected
        buttonType = buttonType.replace(button.textContent.trim(), '').trim(); // Remove text if deselected
    }

    console.log(buttonType.trim());
}

// Apply to queryButton and sortButton
queryButton.addEventListener('click', () => {
    toggleButtonAsOption(queryButton, queryType, '--active-query-col', '#F5B32F', '#302E2E');
});

sortButton.addEventListener('click', () => {
    toggleButtonAsOption(sortButton, sortType, '--active-sort-col', '#F5B32F', '#302E2E');
});

queryOptions.forEach((curEl) => {
    curEl.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the default action of anchor tags
        queryButton.style.setProperty('--active-query-col', '#F5B32F');
        curEl.classList.toggle('selected'); // Toggle the 'selected' class

        if (curEl.classList.contains('selected')) {
            queryType += curEl.textContent.trim() + ' '; // Add to queryType if selected
        } else {
            queryType = queryType.replace(curEl.textContent.trim() + ' ', ''); // Remove from queryType if deselected
        }

        if (queryType.trim() == '') {
            queryButton.style.setProperty('--active-query-col', '#302E2E');
        }

        console.log(queryType.trim()); // Log all the queryOptions that are selected
    });
});

sortOptions.forEach((curEl) => {
    curEl.addEventListener('click', () => {
      sortButton.style.setProperty('--active-sort-col', '#F5B32F');
      curEl.classList.toggle('selected'); // Toggle the 'selected' class
      if (curEl.classList.contains('selected')) {
        sortType += curEl.textContent + ' '; // Add to sortType if selected
      } else {
        sortType = sortType.replace(curEl.textContent, ''); // Remove from sortType if deselected
      }
      if (sortType.trim() == '') {
        sortButton.style.setProperty('--active-sort-col', '#302E2E');
      }
      console.log(sortType.trim()); // Log all the sortOptions that are selected
    });

  });

filterButton.addEventListener('click', () => {
  if(dropdownFilterOptions.style.display === 'none'){
    filterButton.style.borderBottom = 'none';
    filterButton.style.borderRadius = '5px 5px 0 0';
    dropdownFilterOptions.style.display = 'flex';
    filterButton.childNodes[1].style.transform = 'rotate(180deg)'; 
  } else {
    filterButton.style.borderBottom = '2px solid white';
    filterButton.style.borderRadius = '5px';
    dropdownFilterOptions.style.display = 'none';
    filterButton.childNodes[1].style.transform = 'rotate(0deg)';
  }
})

filterOptions.forEach((curEl) => {
  curEl.addEventListener('click', () => {
    if(curEl.classList.contains('selected')){
      curEl.classList.remove('selected');
      filterType = '';
      filterButton.style.setProperty('--active-filter-col', '#302E2E');
    } else {
      filterOptions.forEach((el) => el.classList.remove('selected'))
      curEl.classList.add('selected');
      filterButton.style.setProperty('--active-filter-col', '#F5B32F');
      filterType = curEl.textContent;
      console.log(filterType.trim());
    }
  })
  
})

const clearBtn = document.getElementById('clearBtn');

clearBtn.addEventListener('click', () => {
    sortButton.style.setProperty('--active-sort-col', '#302E2E');
    sortOptions.forEach((el) => el.classList.remove('selected'))
    filterButton.style.setProperty('--active-filter-col', '#302E2E');
    filterOptions.forEach((el) => el.classList.remove('selected'))
    queryButton.style.setProperty('--active-query-col', '#302E2E');
    queryOptions.forEach((el) => el.classList.remove('selected'))
    sortType = '';
    filterType = '';
    queryType = '';
})

const applyBtn = document.getElementById('applyBtn');

applyBtn.addEventListener('click', () => {
  loadRecipes();
})


//REST of the code
stars.forEach((star) => {
    star.addEventListener('click', function () {
        console.log("Star clicked");
        const rating = this.getAttribute('data-value');
        const mealId = document.getElementById('hidden-meal-id').value;
        console.log(mealId); // Get the meal/recipe ID
        const message = JSON.stringify({
            payload: { userID, mealId, rating } // Include meal/recipe ID along with the rating
        });
        ws.send(message);
    });
});

function changeUserID(newID) {
    userID = newID;
}

let recipesData = [];

const ws = new WebSocket('ws://localhost:3001');
ws.onopen = () => {
    console.log('WebSocket connection established');
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch (data.type) {
        case 'error':
            console.log('kafka sended error:', data.payload);
            break;
        case 'success':
            console.error('kafka sended success:', data.payload);
            break;
        case 'error':
            console.error('Error:', data.payload);
            break;
        default:
            console.error('Unknown message type');
    }
};

// Event listeners
searchBtn.addEventListener("click", async (event) => {
    let searchInputTxt = document.getElementById("search-input").value.trim();
    let cleanedInputTxt = searchInputTxt.replace(/\s*,\s*/g, ',');
    showLoadingScreen();
    runPythonScript(cleanedInputTxt)
        .then(() => {
            loadRecipes();
        })
        .catch(error => {
            console.error('Error in the promise chain:', error);
        });
});


mealList.addEventListener("click", getMealRecipe);
recipeCloseBtn.addEventListener("click", () => {
    mealDetailsContent.parentElement.classList.remove("showRecipe");
});

function showLoadingScreen() {
    console.log("showing loading screen")
    loadingScreen.style.display = 'flex';
}

function hideLoadingScreen() {
    console.log("hidding loading screen")
    loadingScreen.style.display = 'none';
}

// Function to run Python script
function runPythonScript(ingredients) {
    console.log("running python script");
    return fetch('http://localhost:3000/run-script', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ingredients })
    })
    .then(response => {
        console.log('Response received');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(data => {
        console.log('Response data:', data);
        hideLoadingScreen();
    })
    .catch(error => {
        console.error('Error running Python script:', error);
        hideLoadingScreen();
    });
}   

// Function to load recipes from JSON file
function loadRecipes() {
    console.log("loadRecipes")
    if (lastQuery === queryType) {
        let tempRecipes = Array.from(recipesData);
        switch (filterType.trim()) {
            case 'Breakfast':
                tempRecipes = tempRecipes.filter(item => item.MealType === 'Breakfast');
                break;
            case 'Lunch':
                tempRecipes = tempRecipes.filter(item => item.MealType === 'Lunch');
                break;
            case 'Dinner':
                tempRecipes = tempRecipes.filter(item => item.MealType === 'Dinner');
                break;
            case 'Dessert':
                tempRecipes = tempRecipes.filter(item => item.MealType === 'Dessert');
                break;
            case 'Beverage':
                tempRecipes = tempRecipes.filter(item => item.MealType === 'Other');
                break;
            default:
                break;
        }

        let sortOptions = {};
        let sortFields = sortType.trim().split(' ');
        if (sortType == '') {
        } else {
            for (let i = 0; i < sortFields.length; i += 2) {
                const fieldName = sortFields[i];
                const order = sortFields[i + 1] === 'ASC' ? 1 : -1;
                sortOptions[fieldName] = order;
            }
        }
        if (Object.keys(sortOptions).length > 0) {
                tempRecipes.sort((a, b) => {
                    for (const field in sortOptions) {
                        if (a[field] < b[field]) return -sortOptions[field];
                        if (a[field] > b[field]) return sortOptions[field];
                    }
                    return 0;
                });
        }
        displayRecipes(tempRecipes);
    } else {
    lastQuery = queryType;
    showLoadingScreen();
    fetch(`http://localhost:3000/result?queryType=${queryType}&sortType=${sortType}&filterType=${filterType}`)
    .then((response) => response.json())
    .then((data) => {
        recipesData = data;
        displayRecipes(recipesData);
        hideLoadingScreen();
    })
    .catch((error) => {
        console.error('Error fetching JSON file:', error);
    });
    }
}

// Function to display recipes
function displayRecipes(recipes) {
    let html = "";
    recipes.forEach((recipe) => {
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

// Get recipe of the meal
function getMealRecipe(e) {
    e.preventDefault();
    if (e.target.classList.contains("recipe-btn")) {
        let mealItem = e.target.parentElement.parentElement;
        let mealId = mealItem.dataset.id;

        let recipe = recipesData.find(recipe => recipe.RecipeId == mealId);
        if (recipe) {
            mealRecipeModal(recipe);
        } else {
            console.error('Recipe not found');
        }
    }
}

// Create a modal
function mealRecipeModal(meal) {
    let html = `
        <input type="hidden" id="hidden-meal-id" value="${meal.RecipeId}">
        <h2 class="recipe-title">${meal.Name}</h2>
        <p class="recipe-category">${meal.RecipeCategory}</p>
        <div class="recipe-instruct">
        <div class="recipe-ingredients">
            <h3>Ingredients:</h3>
                <ul>
                    ${meal.RecipeIngredientQuantities.map((quantity, index) => `
                        <li>${quantity}g ${meal.RecipeIngredientParts[index]}</li>
                    `).join('')}
                </ul>
        </div>
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
