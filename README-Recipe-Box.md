# Recipe Box API

Recipe Box is a CRUD API for saving recipes. Each recipe has a generated ID, a
required name, required ingredients, and an `isFavorite` boolean that defaults
to `false`. PostgreSQL stores recipes through TypeORM; the table is created by
a migration. Reads are public. Creating, updating, and deleting recipes require
a Bearer JWT obtained from `POST /api/auth/login`.

| Action          | Method | URL                |
| --------------- | ------ | ------------------ |
| List recipes    | GET    | `/api/recipes`     |
| Get one recipe  | GET    | `/api/recipes/:id` |
| Create a recipe | POST   | `/api/recipes`     |
| Update a recipe | PATCH  | `/api/recipes/:id` |
| Delete a recipe | DELETE | `/api/recipes/:id` |

Create and update accept JSON such as:

```json
{
  "name": "Pancakes",
  "ingredients": "Flour, eggs, milk",
  "isFavorite": false
}
```

Start the API, PostgreSQL, and Redis with `docker compose up --build`; the API
runs pending migrations before it starts. Run `npm test` and `npm run test:e2e`
to check the service and HTTP routes. The Postman flow is
[`postman/MyTasks-Recipe-Box.postman_collection.json`](./postman/MyTasks-Recipe-Box.postman_collection.json).

## Reflection draft

The hardest part was fitting the recipe feature into a running API while keeping
its controllers, service, entity, and DTOs together in a feature module.
Validation and authenticated writes are checked separately from public reads.
If I had more time, I would add ingredient-by-ingredient storage and recipe
search so recipes could be filtered by what is in the kitchen.
