<script lang="ts">
  import { onMount } from "svelte";
  import { fetchPanels, type Panel } from "../assets/panels";

  let panels: [string, Panel][] = [];
  let error: string | null = null;
  let loading = true;

  onMount(async () => {
    try {
      const data: Record<string, Panel> = await fetchPanels();
      panels = Object.entries(data);
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  });
</script>

{#if loading}
  <p>Loading panels</p>
{:else if error}
  <p style="color:red">Error: {error}</p>
{:else}
  <ul>
    {#each panels as [key, panel]}
      <li>
        <a href={`/product?id=${key}`}>
          {panel.structure} - ${panel.price}
        </a>
      </li>
    {/each}
  </ul>
{/if}
