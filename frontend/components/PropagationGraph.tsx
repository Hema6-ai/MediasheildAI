"use client";
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { GraphData } from "@/lib/api";

const RISK_COLOR: Record<string, string> = {
  HIGH: "#f87171",
  MEDIUM: "#facc15",
  LOW: "#4ade80",
};

interface Props {
  data: GraphData;
}

export function PropagationGraph({ data }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const el = svgRef.current;
    const W = el.clientWidth || 800;
    const H = el.clientHeight || 500;

    d3.select(el).selectAll("*").remove();

    const svg = d3.select(el)
      .attr("viewBox", `0 0 ${W} ${H}`)
      .call(
        d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 3]).on("zoom", (e) => {
          g.attr("transform", e.transform);
        })
      );

    const g = svg.append("g");

    // Build node/edge maps
    const nodeMap = new Map(data.nodes.map((n) => [n.id, { ...n, x: W / 2, y: H / 2 }]));

    const links = data.edges.map((e) => ({
      source: e.source,
      target: e.target,
      weight: e.weight,
    }));

    const nodes = Array.from(nodeMap.values());

    const sim = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(80).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide(28));

    // Arrows
    svg.append("defs").append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 22)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#475569");

    const link = g.append("g").selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", "#334155")
      .attr("stroke-width", (d) => Math.max(1, d.weight * 2))
      .attr("marker-end", "url(#arrow)")
      .attr("stroke-opacity", 0.6);

    const node = g.append("g").selectAll("circle")
      .data(nodes)
      .enter().append("circle")
      .attr("r", (d: any) => d.is_original ? 18 : 12)
      .attr("fill", (d: any) => RISK_COLOR[d.risk_level] || "#4ade80")
      .attr("fill-opacity", 0.85)
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .call(
        d3.drag<SVGCircleElement, any>()
          .on("start", (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
          .on("end", (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "fixed pointer-events-none z-50 glass px-3 py-2 rounded-lg text-xs text-white border border-white/10")
      .style("opacity", 0);

    node
      .on("mouseover", (e, d: any) => {
        tooltip.transition().duration(150).style("opacity", 1);
        tooltip.html(
          `<strong>${d.is_original ? "🎯 ORIGINAL" : "⚠️ COPY"}</strong><br/>` +
          `Platform: ${d.platform}<br/>` +
          `Risk: ${d.risk_level}<br/>` +
          `Views: ${d.views?.toLocaleString()}<br/>` +
          `ID: ${d.id}`
        );
      })
      .on("mousemove", (e) => {
        tooltip
          .style("left", `${e.clientX + 12}px`)
          .style("top", `${e.clientY - 28}px`);
      })
      .on("mouseout", () => {
        tooltip.transition().duration(200).style("opacity", 0);
      });

    // Labels for originals
    const label = g.append("g").selectAll("text")
      .data(nodes.filter((n: any) => n.is_original))
      .enter().append("text")
      .attr("text-anchor", "middle")
      .attr("dy", -22)
      .attr("fill", "#94a3b8")
      .attr("font-size", "10px")
      .text((d: any) => d.id.slice(0, 6));

    sim.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
      label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
    });

    return () => {
      sim.stop();
      tooltip.remove();
    };
  }, [data]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ minHeight: "500px" }}
    />
  );
}
