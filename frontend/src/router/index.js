import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'default',
        component: () => import('../views/HomeView.vue')
    },
    {
        path: '/home',
        name: 'home',
        component: () => import('../views/HomeView.vue')
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'not_found',
        component: () => import('../views/404View.vue')
    },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: routes,
})

router.beforeEach((to, from, next) => {
    // Check if the `to` route exists by comparing it with the defined routes
    const routeExists = routes.some(route => route.name === to.name)

    if (!routeExists && to.name !== 'not_found') {
        // Redirect to 404 page if route doesn't exist
        next({
            name: 'not_found',
            params: { pathMatch: to.path.split('/').slice(1) }, // Keeps the original path in the URL
            query: to.query,
            hash: to.hash,
        })
    } else {
        next() // Proceed to the next route
    }
})

export default router
