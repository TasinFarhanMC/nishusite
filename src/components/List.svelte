<script lang="ts">
  import { onMount } from "svelte";
  import { fetchPanels, type Panel, type PanelRecord } from "../assets/panels";
  import { weightedSearch } from "../assets/search";

  let panels: [string, Panel][] = $state([]);
  let constPanels: [string, Panel][] = $state([]);
  let error: string = $state("");
  let loading = $state(true);

  const weights = {
    price: 2, // make price twice as important
    watt: 1, // default weight
    battery: 2,
    structure: 0.5, // less important
    panelCable: 1,
    wiringCable: 1,
    light: 1,
    charger: 1,
    extraHour: 1,
    dcFanSmall: 1,
  };

  // filter state
  let filters: Partial<Record<keyof Panel, string | number>> = {};

  // pagination state
  let currentPage = $state(1);
  const pageSize = 5;

  onMount(async () => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = Number(params.get("page"));
    if (pageParam && pageParam > 0) currentPage = pageParam;

    try {
      const data: PanelRecord = (await fetchPanels()).panels;
      constPanels = Object.entries(data);
      panels = constPanels;
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  });

  const totalPages = $derived(Math.ceil(panels.length / pageSize));
  let pagedPanels = $derived(
    panels.slice((currentPage - 1) * pageSize, currentPage * pageSize),
  );

  function nextPage() {
    if (currentPage < totalPages) changePage(currentPage + 1);
  }

  function prevPage() {
    if (currentPage > 1) changePage(currentPage - 1);
  }

  function changePage(page: number) {
    currentPage = page;
    const url = new URL(window.location.href);
    url.searchParams.set("page", page.toString());
    window.history.replaceState({}, "", url.toString());
  }

  function search() {
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== null && v !== ""),
    );

    if (Object.keys(activeFilters).length === 0) {
      panels = constPanels;
      return;
    }

    panels = weightedSearch(constPanels, activeFilters, weights);
  }
</script>

{#if loading}
  <p>Loading panels</p>
{:else if error}
  <p style="color:red">Error: {error}</p>
{:else}
  <div
    style="margin-bottom: 1rem; display: flex; flex-wrap: wrap; gap: 0.5rem;"
  >
    <input placeholder="Structure" bind:value={filters.structure} />
    <input placeholder="Price" type="number" bind:value={filters.price} />
    <input placeholder="Battery" type="number" bind:value={filters.battery} />
    <input placeholder="Watt" type="number" bind:value={filters.watt} />
    <input
      placeholder="Panel Cable"
      type="number"
      bind:value={filters.panelCable}
    />
    <input
      placeholder="Wiring Cable"
      type="number"
      bind:value={filters.wiringCable}
    />
    <input placeholder="Light" type="number" bind:value={filters.light} />
    <input placeholder="Charger" type="number" bind:value={filters.charger} />
    <input
      placeholder="Extra Hour"
      type="number"
      bind:value={filters.extraHour}
    />
    <input
      placeholder="DC Fan Small"
      type="number"
      bind:value={filters.dcFanSmall}
    />
    <!-- Add any other numeric or string fields from Panel here -->
    <button onclick={search}>Search</button>
  </div>

  <ul>
    {#each pagedPanels as [key, panel]}
      <li>
        <a href={`/product?id=${key}`}>
          {panel.structure} - ${panel.price} - {panel.watt}W - Battery: {panel.battery}Ah
        </a>
      </li>
    {/each}
  </ul>

  <div style="margin-top:1rem">
    <button onclick={prevPage} disabled={currentPage === 1}>Prev</button>
    <span>Page {currentPage} of {totalPages}</span>
    <button onclick={nextPage} disabled={currentPage === totalPages}
      >Next</button
    >
  </div>
{/if}
