<script lang="ts">
  import { onMount } from "svelte";
  import { fetchPanel, Panel } from "../assets/panels";

  let panel: Panel | undefined = undefined;
  let error: string | undefined = undefined;
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
    <li>Panel Cable: {panel.panelCable}</li>
    <li>Wiring Cable: {panel.wiringCable}</li>
    <li>Light: {panel.light}</li>
    <li>Charger: {panel.charger}</li>
    <li>DC Fan Small: {panel.dcFanSmall}</li>
    <li>DC Fan Table: {panel.dcFanTable}</li>
    <li>DC Fan Stand: {panel.dcFanStand}</li>
    <li>Hour: {panel.hour}</li>
    <li>Extra Hour: {panel.extraHour}</li>
    <li>Price: ${panel.price}</li>
  </ul>
{/if}
