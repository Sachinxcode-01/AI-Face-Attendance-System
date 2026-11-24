#!/usr/bin/env python3
"""SmartFace Attendance: Developer Knowledge Graph Query Engine

Fast, token-free graph traversal across the SmartFace Attendance Monorepo.
Answers architectural and dependency questions instantly using `graphify-out/graph.json`.
"""

import argparse
import json
import re
import sys
from pathlib import Path

import networkx as nx
from networkx.readwrite import json_graph

GRAPH_PATH = Path("graphify-out/graph.json")
CUSTOM_QUESTIONS_PATH = Path("graphify-out/CUSTOM_GRAPH_QUESTIONS.md")

PRESET_COMMANDS = {
    "explain attendance flow": "Attendance Processing Flow",
    "find dead code": "DEAD_CODE",
    "trace attendance api": "API Route Relationships",
    "show authentication architecture": "Authentication Flow",
    "show face recognition flow": "Face Recognition Flow",
    "show role permission map": "RBAC Flow",
    "show queue dependencies": "Queue Dependencies",
    "show portal to backend dependencies": "Portal to Backend Dependencies",
    "show mobile to backend dependencies": "Mobile to Backend Dependencies",
}

def load_graph():
    if not GRAPH_PATH.exists():
        print(f"Error: {GRAPH_PATH} not found. Please run 'python scripts/build_knowledge_graph.py' first.")
        sys.exit(1)
    data = json.loads(GRAPH_PATH.read_text(encoding="utf-8"))
    return json_graph.node_link_graph(data, edges="links")

def find_node(G, term):
    term = term.lower()
    scored = []
    for nid, ndata in G.nodes(data=True):
        lbl = (ndata.get("label", "") or "").lower()
        src = (ndata.get("source_file", "") or "").lower()
        score = 0
        for w in term.split():
            if w in lbl:
                score += 3
            if w in src:
                score += 2
            if w in nid.lower():
                score += 1
        if score > 0:
            scored.append((score, nid))
    scored.sort(reverse=True)
    return scored[0][1] if scored else None

def shortest_path(G, src_term, tgt_term):
    src = find_node(G, src_term)
    tgt = find_node(G, tgt_term)
    if not src or not tgt:
        print(f"Could not locate matching nodes for: '{src_term}' or '{tgt_term}'")
        return

    src_label = G.nodes[src].get("label", src)
    tgt_label = G.nodes[tgt].get("label", tgt)
    print(f"\nTrace Shortest Path:")
    print(f"  Source: {src_label} [{G.nodes[src].get('source_file','')}]")
    print(f"  Target: {tgt_label} [{G.nodes[tgt].get('source_file','')}]\n")

    try:
        path = nx.shortest_path(G, src, tgt)
        print(f"Shortest path found ({len(path) - 1} hops):")
        for i, nid in enumerate(path):
            ndata = G.nodes[nid]
            label = ndata.get("label", nid)
            src_file = ndata.get("source_file", "")
            domain = ndata.get("community_name", "")
            if i < len(path) - 1:
                next_nid = path[i + 1]
                edge_data = G.get_edge_data(nid, next_nid)
                if isinstance(edge_data, dict):
                    # MultiGraph or single dict
                    first_val = next(iter(edge_data.values())) if 0 in edge_data else edge_data
                    rel = first_val.get("relation", "connects_to")
                    ctx = first_val.get("context", "")
                else:
                    rel = "connects_to"
                    ctx = ""
                print(f"  [{i+1}] {label} ({domain})")
                print(f"       │  --{rel}--> [{ctx}]")
            else:
                print(f"  [{i+1}] {label} ({domain}) [TARGET REACHED]")
    except nx.NetworkXNoPath:
        print(f"No reachable path found between '{src_term}' and '{tgt_term}'.")

def explain_node(G, term):
    nid = find_node(G, term)
    if not nid:
        print(f"No node found matching '{term}'")
        return
    nd = G.nodes[nid]
    print(f"\nNode Explanation: {nd.get('label', nid)}")
    print(f"  Domain:          {nd.get('community_name', 'General')}")
    print(f"  Source File:     {nd.get('source_file', 'N/A')}")
    print(f"  Location:        {nd.get('source_location', 'N/A')}")
    print(f"  Type:            {nd.get('file_type', 'N/A')}")
    print(f"  In-Degree:       {G.in_degree(nid) if G.is_directed() else G.degree(nid)}")
    print(f"  Out-Degree:      {G.out_degree(nid) if G.is_directed() else G.degree(nid)}")
    if nd.get("architecture_boundary"):
        print(f"  Boundary:        {nd.get('architecture_boundary')} [{nd.get('criticality')}]")

    print("\nConnected Neighbors & Relationships:")
    for neighbor in list(G.neighbors(nid))[:20]:
        nbr_data = G.nodes[neighbor]
        edge = G.get_edge_data(nid, neighbor)
        if isinstance(edge, dict):
            first_val = next(iter(edge.values())) if 0 in edge else edge
            rel = first_val.get("relation", "linked")
        else:
            rel = "linked"
        print(f"  --> [{rel}] {nbr_data.get('label', neighbor)} ({nbr_data.get('source_file', '')})")

def answer_query(G, query_text):
    q_lower = query_text.lower().strip()
    
    # Check preset workflow shortcuts
    for cmd, mapped_ctx in PRESET_COMMANDS.items():
        if cmd in q_lower:
            print(f"\n[Command Matched: '{cmd.title()}']")
            if mapped_ctx == "DEAD_CODE":
                p = Path("graphify-out/DEAD_CODE_REPORT.md")
                if p.exists():
                    print(p.read_text(encoding="utf-8")[:1500])
                return
            
            # Print matching edges from graph
            print(f"Tracing '{mapped_ctx}' through authoritative graph:")
            matched_edges = []
            for u, v, edata in G.edges(data=True):
                ctx = edata.get("context", "")
                rel = edata.get("relation", "")
                if mapped_ctx.lower() in ctx.lower() or mapped_ctx.lower() in rel.lower():
                    matched_edges.append((G.nodes[u].get("label", u), rel, ctx, G.nodes[v].get("label", v)))
            
            for src_lbl, rel, ctx, tgt_lbl in matched_edges[:15]:
                print(f"  • {src_lbl} --[{rel}]--> {tgt_lbl} (context: {ctx})")
            return

    # Check pre-computed questions
    if CUSTOM_QUESTIONS_PATH.exists():
        cq_text = CUSTOM_QUESTIONS_PATH.read_text(encoding="utf-8")
        for chunk in cq_text.split("### Q: "):
            if not chunk.strip():
                continue
            lines = chunk.split("\n", 1)
            q_title = lines[0].strip()
            # check similarity
            words = [w for w in re.findall(r"\w+", q_lower) if len(w) > 3]
            match_count = sum(1 for w in words if w in q_title.lower())
            if match_count >= 2:
                print(f"\n[Authoritative Knowledge Graph Result]")
                print(f"Question: {q_title}")
                print(lines[1].strip())
                return

    # General BFS exploration
    nid = find_node(G, query_text)
    if nid:
        explain_node(G, query_text)
    else:
        print(f"No direct match for '{query_text}'. Searching vocabulary tokens...")
        vocab_path = Path("graphify-out/.vocab.txt")
        if vocab_path.exists():
            vocab = vocab_path.read_text(encoding="utf-8").splitlines()
            matches = [v for v in vocab if any(w in v for w in query_text.lower().split() if len(w) > 3)]
            if matches:
                print(f"Suggested graph tokens: {', '.join(matches[:10])}")
            else:
                print("Corpus does not contain relevant tokens for this query.")

def main():
    parser = argparse.ArgumentParser(description="SmartFace Attendance: Knowledge Graph CLI")
    parser.add_argument("query", nargs="*", help="Natural language question or command")
    parser.add_argument("--path", nargs=2, metavar=("SRC", "TGT"), help="Find shortest path between two components")
    parser.add_argument("--explain", metavar="NODE", help="Explain a specific component and its connections")
    parser.add_argument("--dead-code", action="store_true", help="Display dead code report")
    parser.add_argument("--audit-protection", action="store_true", help="Audit core/ architecture boundaries")

    args = parser.parse_args()
    G = load_graph()

    if args.path:
        shortest_path(G, args.path[0], args.path[1])
    elif args.explain:
        explain_node(G, args.explain)
    elif args.dead_code:
        p = Path("graphify-out/DEAD_CODE_REPORT.md")
        print(p.read_text(encoding="utf-8") if p.exists() else "No dead code report found.")
    elif args.audit_protection:
        p = Path("graphify-out/DUPLICATE_CODE_REPORT.md")
        print(p.read_text(encoding="utf-8") if p.exists() else "No protection report found.")
    elif args.query:
        answer_query(G, " ".join(args.query))
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
