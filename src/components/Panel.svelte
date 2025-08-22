<script lang="ts">
  import { onMount } from "svelte";
  import type { Panel } from "../libs/panels";
  import { fetchPanels } from "../libs/panels";

  let panel: Panel | null = null;
  let error: string | null = null;
  let loading = true;

  onMount(async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    try {
      if (!id) {
        error = "No panel id provided.";
        return;
      }

      const panels = await fetchPanels();
      if (!(id in panels)) {
        error = `Panel with id "${id}" not found.`;
      } else {
        panel = panels[id];
      }
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  });
</script>

{#if loading}
  <p>Loading panel...</p>
{:else if error}
  <p style="color:red">{error}</p>
{:else if panel}
  <h1>{panel.structure}</h1>
  <ul>
    <li>Watt: {panel.watt}</li>
    <li>Battery: {panel.battary}</li>
    <li>Panel Cable: {panel.panel_cable}</li>
    <li>Wiring Cable: {panel.wiring_cable}</li>
    <li>Light: {panel.light}</li>
    <li>Charger: {panel.charger}</li>
    <li>DC Fan Small: {panel.dc_fan_small}</li>
    <li>DC Fan Table: {panel.dc_fan_table}</li>
    <li>DC Fan Stand: {panel.dc_fan_stand}</li>
    <li>Hour: {panel.hour}</li>
    <li>Extra Hour: {panel.extra_hour}</li>
    <li>Price: ${panel.price}</li>
  </ul>
{/if}
