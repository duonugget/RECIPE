const { chromium } = require('playwright');

const simulateUser = async (userID) => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    for (let i = 0; i < 5; i++) {
        const ingredients = 'tomato';
        // const randomIngredientIndex = Math.floor(Math.random() * ingredients.length) + 1;
        // const randomIngredient = ingredients[randomIngredientIndex];

        await page.goto('http://127.0.0.1:5500/recipeQuery/recipeSearch.html');
        await page.fill('#search-input', ingredients);
        await page.click('#search-btn');

        // Wait for results
        await page.waitForSelector('.meal-item', { timeout: 50000 });
        const recipes = await page.document.querySelectorAll('.meal-item');

        // Choose a random recipe to view
        const randomRecipeIndex = Math.floor(Math.random() * recipes.length);
        const randomRecipe = recipes[randomRecipeIndex];
        await randomRecipe.click('recipe-btn');

        await page.waitForSelector('.showRecipe', { timeout: 50000 });

        const stars = await page.document.querySelectorAll('.stars i');
        const randomStarIndex = Math.floor(Math.random() * stars.length);
        const randomStar = stars[randomStarIndex];
        await randomStar.click();

        // Wait for a random time before searching for the next recipe
        const waitTime = Math.floor(Math.random() * 5000) + 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Close the browser
    await browser.close();
};

// Simulate multiple users simultaneously
const numUsers = 10000;
const users = [];
for (let i = 1; i < numUsers; i++) {
    users.push(simulateUser(i));
}

Promise.all(users)
    .then(() => console.log('All users completed their tasks.'))
    .catch(error => console.error('Error:', error));
