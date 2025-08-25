<script lang="ts">
  import { onMount } from "svelte";
  import { fetchPanels, type Panel, type PanelRecord } from "../assets/panels";

  let panels: [string, Panel][] = $state([]);
  let error: string = $state("");
  let loading = $state(true);

  // pagination state
  let currentPage = $state(1);
  const pageSize = 5;

  onMount(async () => {
    // read page from URL ?page=2
    const params = new URLSearchParams(window.location.search);
    const pageParam = Number(params.get("page"));
    if (pageParam && pageParam > 0) currentPage = pageParam;

    try {
      const data: PanelRecord = (await fetchPanels()).panels;
      panels = Object.entries(data);
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
    // update URL without reload
    const url = new URL(window.location.href);
    url.searchParams.set("page", page.toString());
    window.history.replaceState({}, "", url.toString());
  }
</script>

{#if loading}
  <p>Loading panels</p>
{:else if error}
  <p style="color:red">Error: {error}</p>
{:else}
  <ul>
    {#each pagedPanels as [key, panel]}
      <li>
        <a href={`/product?id=${key}`}>
          {panel.structure} - ${panel.price}
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
