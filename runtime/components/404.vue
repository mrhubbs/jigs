<template>
  <div class='four-oh-four'>
    <span style='font-size: 4rem; font-weight: bold;'>404!!</span>
  </div>
</template>

<script>
  export default {
    name: 'four-oh-four'
  }
</script>

<style scoped>
  .four-oh-four {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
</style>
