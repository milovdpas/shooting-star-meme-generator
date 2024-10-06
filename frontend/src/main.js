import {createApp} from 'vue';

import {library} from '@fortawesome/fontawesome-svg-core';
import {faCheck,} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome';

import App from './App.vue';
import router from './router';

library.add(faCheck);

const app = createApp(App);

app.component('font-awesome-icon', FontAwesomeIcon);

app.use(router);

app.mount('#app');
