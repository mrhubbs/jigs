<template>
  <!--
    Gotta have just one root element, since all the HTML is ultimately
    processed as a Vue SFC.
  -->
  <div class='relative flex flex-col min-h-screen'>
    <header class="container mx-auto">
      Caput!
    </header>

    <div class="flex-1 container mx-auto">
      <slot></slot>
    </div>

    <footer class="container mx-auto pin-b">
      Feet!
    </footer>
  </div>
</template>
