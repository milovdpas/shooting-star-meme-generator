<template>
  <RouterView/>
</template>

<script>
export default {
  components: {},
  data() {
    return {}
  },
  mounted() {
  },
  methods: {}
};
</script>

<style lang="scss">
@import "assets/scss/_fonts.scss";
@import "assets/scss/_defaults.scss";

::selection {
  background: $blue;
  color: $white;
}

#app {
  font-family: $fontstack;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  position: relative;
}

section {
  scroll-snap-align: start;
}

// Scroll bar
/* width */
::-webkit-scrollbar {
  width: 11px !important;
}

/* Track */
::-webkit-scrollbar-track {
  background-color: lightgrey;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: $blue;
  border-radius: 10px;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: $dark-blue;
}
</style>
