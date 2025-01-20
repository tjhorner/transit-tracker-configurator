<script lang="ts">
  export let width: string = '100%';
  export let height: string = '1em';
  export let borderRadius: string = '4px';
</script>

<style>
  .skeleton {
    background: linear-gradient(
      to right,
      #f0f0f0 0%,
      #e0e0e0 50%,
      #f0f0f0 100%
    );
    animation: shimmer 4s infinite linear;
  }

  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }
</style>

<div
  class="skeleton"
  style="width: {width}; height: {height}; border-radius: {borderRadius};"
></div>