<template>
  <div class='font-bold example-component'>
    <span>I {{desc}}</span>
  </div>
</template>

<script>
  export default {
    name: "ExampleComponent",
    props: [ 'desc' ]
  }
</script>

<style lang='vcss'>
  .example-component {
    color: green;
  }
</style>
