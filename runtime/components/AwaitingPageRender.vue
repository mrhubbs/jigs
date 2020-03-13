<template>
  <div class='preview-container'>
    <div class='preview-message'>
      <h2 style='margin-bottom: 1rem;'>
        Please Wait While the Page Is Rendered
      </h2>

      <p style='margin-bottom: 1rem;'>
        {{ route }}
      </p>

      <p style='font-style: italic; font-size: 0.8rem;'>
        (This message is only displayed in live preview mode.)
      </p>
    </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'awaiting-page-render',
    props: [ 'route' ]
  }
</script>

<style scoped>
  .preview-container {
    background: rgba(11, 11, 11, 0.6);

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    position: fixed;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;

    z-index: 1000000000;
  }

  .preview-message {
    background: #ffffff;
    border-radius: 10px;

    padding: 2rem;

    z-index: 1000000001;
  }
</style>
