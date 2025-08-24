<script lang="ts">
  import { onMount } from "svelte";
  import { fetchPanel, type Panel } from "../assets/panels";

  let panel: Panel | null = null;
  let error: string | null = null;
  let loading = true;
  onMount(async () => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("id");
    const id = idParam !== null ? Number(idParam) : NaN;

    try {
      if (idParam === null || isNaN(id)) {
        error = "No valid panel id provided.";
        return;
      }

      panel = await fetchPanel(id);

      if (panel == null) {
        error = `Panel with id "${id}" not found.`;
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
    <li>Battery: {panel.battery}</li>
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
