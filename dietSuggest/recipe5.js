const searchBtn = document.getElementById("search-btn");
const mealList = document.getElementById("meal");
const mealDetailsContent = document.querySelector(".meal-details-content");
const recipeCloseBtn = document.getElementById("recipe-close-btn");
const mealContainer = document.querySelector(".container");
const loadingScreen = document.getElementById("loading-screen");

const userID = sessionStorage.getItem('userID');

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

dropdownSortOptions.style.display = "none";

let sortType = '';



sortButton.addEventListener('click', () => {
  if(dropdownSortOptions.style.display === 'none'){
    sortButton.style.borderBottom = 'none';
    sortButton.style.borderRadius = '5px 5px 0 0';
    dropdownSortOptions.style.display = 'flex';
    sortButton.childNodes[1].style.transform = 'rotate(180deg)'; 
  } else {
    sortButton.style.borderBottom = '2px solid white';
    sortButton.style.borderRadius = '5px';
    dropdownSortOptions.style.display = 'none';
    sortButton.childNodes[1].style.transform = 'rotate(0deg)';
  }
})


sortOptions.forEach((curEl) => {
    curEl.addEventListener('click', () => {
      sortButton.style.setProperty('--active-sort-col', '#F5B32F');
      curEl.classList.toggle('selected'); // Toggle the 'selected' class
      if (curEl.classList.contains('selected')) {
        sortType += curEl.textContent + ' '; // Add to sortType if selected
      } else {
        sortType = sortType.replace(curEl.textContent.trim() + " ", ''); // Remove from sortType if deselected
      }
      if (sortType.trim() == '') {
        sortButton.style.setProperty('--active-sort-col', '#302E2E');
      }
      console.log(sortType.trim()); // Log all the sortOptions that are selected
    });

  });


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


let recipesData = [];

// Event listeners
searchBtn.addEventListener("click", async (event) => {
    // loadRecipes();
    showLoadingScreen();
    runPythonScript()
        .then(() => {
            loadRecipes(); // Call this only after runPythonScript completes
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
function runPythonScript() {
    let criteria;
    let asc;
    if (sortType.trim() === '') {
        criteria = 'Random';
        asc = 'True';
    } else {
        const sortFields = sortType.trim().split(' ');
        criteria = sortFields[0];
        asc = 'True';
        if (sortFields[1] === 'ASC') {
        } else {
            asc = 'False';
        }
    }
    console.log("running python script");
    console.log({userID,criteria,asc})
    return fetch('http://localhost:3080/run-script', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ UserId: userID, Criteria: criteria, Asc: asc })
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
    fetch('http://localhost:3080/result')
    .then((response) => response.json())
    .then((data) => {
        recipesData = data;
        displayRecipes(); // Display recipes after loading
    })
    .catch((error) => {
        console.error('Error fetching JSON file:', error);
    });
}

// Function to display recipes
function displayRecipes() {
    let html = "";
    for (let i = 0; i < recipesData.length; i += 5) {
        let chunk = recipesData.slice(i, i + 5);
        html += `
            <div class="meal-container">
                <div class="meal-group">
                    ${chunk.map(recipe => `
                        <div class="meal-item" data-id="${recipe.RecipeId}">
                        <h3 class="meal-type">${recipe.MealType}</h3>
                            <div class="meal-img">
                                <img src="${recipe.Images[0]}" alt="food">
                            </div>
                            <div class="meal-name">
                                <h3>${recipe.Name}</h3>
                                <p>${recipe.Description}</p>
                                <a href="#" class="recipe-btn">Get Recipe</a>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    document.getElementById("meal").innerHTML = html;
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
