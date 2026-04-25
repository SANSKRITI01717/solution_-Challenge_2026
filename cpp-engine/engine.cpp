#define _USE_MATH_DEFINES
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif
#include <iostream>
#include <vector>
#include <queue>
#include <unordered_map>
#include <algorithm>
#include <cmath>
#include <string>
#include <sstream>
#include <fstream>
#include <climits>
#include <utility>
#include <set>

// ─────────────────────────────────────────────
//  DATA STRUCTURES
// ─────────────────────────────────────────────

struct Coordinate {
    double lat, lng;
};

double euclideanDistance(const Coordinate& a, const Coordinate& b) {
    double dlat = a.lat - b.lat;
    double dlng = a.lng - b.lng;
    return std::sqrt(dlat * dlat + dlng * dlng);
}

// Haversine distance in km (for real-world accuracy)
double haversineDistance(const Coordinate& a, const Coordinate& b) {
    const double R = 6371.0;
    double dLat = (b.lat - a.lat) * M_PI / 180.0;
    double dLng = (b.lng - a.lng) * M_PI / 180.0;
    double sinLat = std::sin(dLat / 2);
    double sinLng = std::sin(dLng / 2);
    double h = sinLat * sinLat +
               std::cos(a.lat * M_PI / 180.0) *
               std::cos(b.lat * M_PI / 180.0) *
               sinLng * sinLng;
    return 2 * R * std::asin(std::sqrt(h));
}

struct DisasterZone {
    std::string id;
    std::string name;
    Coordinate  coord;
    int         severity;        // 1-10
    int         peopleAffected;
    std::string requiredSkill;   // medical | rescue | logistics
    double      priorityScore;
    bool        needsHelp;

    // Priority = severity*0.5 + log(people)*0.3 + severity/10*0.2
    void calcPriority() {
        double peopleFactor = (peopleAffected > 0)
            ? std::log(static_cast<double>(peopleAffected) + 1) * 0.3
            : 0;
        priorityScore = severity * 0.5 + peopleFactor + (severity / 10.0) * 0.2;
    }
};

struct Volunteer {
    std::string id;
    std::string name;
    Coordinate  coord;
    std::string skill;   // medical | rescue | logistics
    bool        available;
    std::string assignedZoneId;
};

struct Resource {
    std::string id;
    std::string type;   // food | medicine | shelter
    int         quantity;
    Coordinate  coord;
    std::string ngoId;
};

struct Assignment {
    std::string volunteerId;
    std::string zoneId;
    double      distanceKm;
    std::string skill;
};

// ─────────────────────────────────────────────
//  1. PRIORITY QUEUE (MAX-HEAP)
//     Always process the most urgent zone first
// ─────────────────────────────────────────────

struct ZoneComparator {
    bool operator()(const DisasterZone* a, const DisasterZone* b) const {
        return a->priorityScore < b->priorityScore; // max-heap
    }
};

using ZonePQ = std::priority_queue<
    DisasterZone*,
    std::vector<DisasterZone*>,
    ZoneComparator
>;

ZonePQ buildPriorityQueue(std::vector<DisasterZone>& zones) {
    ZonePQ pq;
    for (auto& z : zones) {
        z.calcPriority();
        if (z.needsHelp) pq.push(&z);
    }
    return pq;
}

// ─────────────────────────────────────────────
//  2. GRAPH + DIJKSTRA
//     Find shortest path from zone to volunteers
//     Nodes = zones + volunteer locations
// ─────────────────────────────────────────────

struct GraphNode {
    std::string id;
    Coordinate  coord;
    std::string type; // "zone" | "volunteer"
};

struct Edge {
    int    to;
    double weight; // distance in km
};

class Graph {
public:
    std::vector<GraphNode>        nodes;
    std::vector<std::vector<Edge>> adj;

    int addNode(const GraphNode& n) {
        nodes.push_back(n);
        adj.push_back({});
        return static_cast<int>(nodes.size()) - 1;
    }

    void addEdge(int u, int v, double w) {
        adj[u].push_back({v, w});
        adj[v].push_back({u, w});
    }

    // Build complete graph: every node connected to every other
    void buildComplete() {
        int n = static_cast<int>(nodes.size());
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                double d = haversineDistance(nodes[i].coord, nodes[j].coord);
                addEdge(i, j, d);
            }
        }
    }

    // Dijkstra from src — returns distances to all nodes
    std::vector<double> dijkstra(int src) {
        int n = static_cast<int>(nodes.size());
        std::vector<double> dist(n, 1e18);
        std::priority_queue<
            std::pair<double, int>,
            std::vector<std::pair<double, int>>,
            std::greater<std::pair<double, int>>
        > pq;
        dist[src] = 0.0;
        pq.push(std::make_pair(0.0, src));

        while (!pq.empty()) {
            double d = pq.top().first;
            int    u = pq.top().second;
            pq.pop();
            if (d > dist[u]) continue;
            for (size_t i = 0; i < adj[u].size(); i++) {
                Edge& e = adj[u][i];
                if (dist[u] + e.weight < dist[e.to]) {
                    dist[e.to] = dist[u] + e.weight;
                    pq.push(std::make_pair(dist[e.to], e.to));
                }
            }
        }
        return dist;
    }
};

// ─────────────────────────────────────────────
//  3. GREEDY MATCHER (Multi-Volunteer)
//     Volunteers needed = ceil(peopleAffected / 500)
//     capped at 6 per zone.
//     For each zone (priority desc):
//       - Calculate how many volunteers needed
//       - Filter by skill, pick N nearest via Dijkstra
// ─────────────────────────────────────────────

int volunteersNeeded(const DisasterZone& z) {
    int needed = (z.peopleAffected + 499) / 500;
    if (needed < 1) needed = 1;
    if (needed > 6) needed = 6;
    return needed;
}

std::vector<Assignment> greedyMatch(
    std::vector<DisasterZone>& zones,
    std::vector<Volunteer>&    volunteers
) {
    Graph g;
    std::unordered_map<std::string, int> idToIndex;

    for (size_t i = 0; i < zones.size(); i++) {
        if (!zones[i].needsHelp) continue;
        int idx = g.addNode({zones[i].id, zones[i].coord, "zone"});
        idToIndex[zones[i].id] = idx;
    }
    for (size_t i = 0; i < volunteers.size(); i++) {
        int idx = g.addNode({volunteers[i].id, volunteers[i].coord, "volunteer"});
        idToIndex[volunteers[i].id] = idx;
    }
    g.buildComplete();

    std::vector<DisasterZone*> sortedZones;
    for (size_t i = 0; i < zones.size(); i++) {
        if (zones[i].needsHelp) sortedZones.push_back(&zones[i]);
    }
    std::sort(sortedZones.begin(), sortedZones.end(),
        [](const DisasterZone* a, const DisasterZone* b) {
            return a->priorityScore > b->priorityScore;
        });

    std::vector<Assignment> assignments;

    for (size_t zi = 0; zi < sortedZones.size(); zi++) {
        DisasterZone* zone = sortedZones[zi];
        int zoneIdx = idToIndex.count(zone->id) ? idToIndex[zone->id] : -1;
        if (zoneIdx < 0) continue;

        int needed = volunteersNeeded(*zone);
        std::vector<double> dists = g.dijkstra(zoneIdx);

        // Collect skill-matched available volunteers sorted by distance
        std::vector<std::pair<double, Volunteer*> > candidates;
        for (size_t vi = 0; vi < volunteers.size(); vi++) {
            Volunteer& vol = volunteers[vi];
            if (!vol.available) continue;
            if (vol.skill != zone->requiredSkill && zone->requiredSkill != "any") continue;
            int vIdx = idToIndex.count(vol.id) ? idToIndex[vol.id] : -1;
            if (vIdx < 0) continue;
            candidates.push_back(std::make_pair(dists[vIdx], &vol));
        }

        std::sort(candidates.begin(), candidates.end(),
            [](const std::pair<double, Volunteer*>& a, const std::pair<double, Volunteer*>& b) {
                return a.first < b.first;
            });

        int assigned = 0;
        for (size_t ci = 0; ci < candidates.size() && assigned < needed; ci++) {
            Volunteer* vol = candidates[ci].second;
            double dist    = candidates[ci].first;
            vol->available      = false;
            vol->assignedZoneId = zone->id;
            assignments.push_back({vol->id, zone->id, dist, vol->skill});
            assigned++;
        }
    }

    return assignments;
}


// ─────────────────────────────────────────────
//  SIMPLE JSON PARSER (no external deps)
//  Parses flat key:"value" pairs from JSON
// ─────────────────────────────────────────────

std::string jsonGetString(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\"";
    size_t pos = json.find(search);
    if (pos == std::string::npos) return "";
    pos = json.find(':', pos + search.size());
    if (pos == std::string::npos) return "";
    size_t start = json.find('"', pos + 1);
    if (start == std::string::npos) return "";
    size_t end = json.find('"', start + 1);
    if (end == std::string::npos) return "";
    return json.substr(start + 1, end - start - 1);
}

double jsonGetDouble(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\"";
    size_t pos = json.find(search);
    if (pos == std::string::npos) return 0.0;
    pos = json.find(':', pos + search.size());
    if (pos == std::string::npos) return 0.0;
    size_t start = pos + 1;
    while (start < json.size() && (json[start]==' '||json[start]=='\t')) start++;
    size_t end = start;
    while (end < json.size() && (isdigit(json[end])||json[end]=='.'||json[end]=='-')) end++;
    if (start == end) return 0.0;
    return std::stod(json.substr(start, end - start));
}

bool jsonGetBool(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\"";
    size_t pos = json.find(search);
    if (pos == std::string::npos) return false;
    pos = json.find(':', pos + search.size());
    if (pos == std::string::npos) return false;
    size_t start = pos + 1;
    while (start < json.size() && (json[start]==' '||json[start]=='\t')) start++;
    return json.substr(start, 4) == "true";
}

// Split JSON array string into individual object strings
std::vector<std::string> splitJsonArray(const std::string& json, const std::string& key) {
    std::vector<std::string> result;
    std::string search = "\"" + key + "\"";
    size_t pos = json.find(search);
    if (pos == std::string::npos) return result;
    pos = json.find('[', pos);
    if (pos == std::string::npos) return result;

    int depth = 0;
    size_t objStart = std::string::npos;
    for (size_t i = pos; i < json.size(); i++) {
        if (json[i] == '{') {
            if (depth == 0) objStart = i;
            depth++;
        } else if (json[i] == '}') {
            depth--;
            if (depth == 0 && objStart != std::string::npos) {
                result.push_back(json.substr(objStart, i - objStart + 1));
                objStart = std::string::npos;
            }
        } else if (json[i] == ']' && depth == 0) {
            break;
        }
    }
    return result;
}

// ─────────────────────────────────────────────
//  JSON OUTPUT BUILDER
// ─────────────────────────────────────────────

std::string escapeJson(const std::string& s) {
    std::string out;
    for (char c : s) {
        if (c == '"')  out += "\\\"";
        else if (c == '\\') out += "\\\\";
        else out += c;
    }
    return out;
}

std::string buildOutput(
    const std::vector<DisasterZone>&  zones,
    const std::vector<Volunteer>&     volunteers,
    const std::vector<Assignment>&    assignments
) {
    std::ostringstream o;
    o << "{\n";

    // Sorted zones
    o << "  \"prioritizedZones\": [\n";
    std::vector<const DisasterZone*> sz;
    for (auto& z : zones) sz.push_back(&z);
    std::sort(sz.begin(), sz.end(), [](auto a, auto b){
        return a->priorityScore > b->priorityScore;
    });
    for (size_t i = 0; i < sz.size(); i++) {
        auto* z = sz[i];
        o << "    {\"id\":\"" << escapeJson(z->id)
          << "\",\"name\":\"" << escapeJson(z->name)
          << "\",\"priorityScore\":" << z->priorityScore
          << ",\"severity\":" << z->severity
          << ",\"peopleAffected\":" << z->peopleAffected
          << ",\"requiredSkill\":\"" << escapeJson(z->requiredSkill)
          << "\",\"needsHelp\":" << (z->needsHelp ? "true" : "false")
          << ",\"lat\":" << z->coord.lat
          << ",\"lng\":" << z->coord.lng
          << "}";
        if (i + 1 < sz.size()) o << ",";
        o << "\n";
    }
    o << "  ],\n";

    // Assignments
    o << "  \"assignments\": [\n";
    for (size_t i = 0; i < assignments.size(); i++) {
        auto& a = assignments[i];
        o << "    {\"volunteerId\":\"" << escapeJson(a.volunteerId)
          << "\",\"zoneId\":\"" << escapeJson(a.zoneId)
          << "\",\"distanceKm\":" << a.distanceKm
          << ",\"skill\":\"" << escapeJson(a.skill) << "\"}";
        if (i + 1 < assignments.size()) o << ",";
        o << "\n";
    }
    o << "  ],\n";

    // Volunteer status
    o << "  \"volunteerStatus\": [\n";
    for (size_t i = 0; i < volunteers.size(); i++) {
        auto& v = volunteers[i];
        o << "    {\"id\":\"" << escapeJson(v.id)
          << "\",\"name\":\"" << escapeJson(v.name)
          << "\",\"available\":" << (v.available ? "true" : "false")
          << ",\"skill\":\"" << escapeJson(v.skill)
          << "\",\"assignedZoneId\":\"" << escapeJson(v.assignedZoneId)
          << "\",\"lat\":" << v.coord.lat
          << ",\"lng\":" << v.coord.lng
          << "}";
        if (i + 1 < volunteers.size()) o << ",";
        o << "\n";
    }
    o << "  ],\n";

    // Stats
    int assigned = static_cast<int>(assignments.size());
    int unmatched = 0;
    for (auto& z : zones) {
        if (z.needsHelp) {
            bool found = false;
            for (auto& a : assignments) if (a.zoneId == z.id) { found = true; break; }
            if (!found) unmatched++;
        }
    }
    o << "  \"stats\": {"
      << "\"totalZones\":" << zones.size()
      << ",\"assignedZones\":" << assigned
      << ",\"unmatchedZones\":" << unmatched
      << ",\"availableVolunteers\":" << (volunteers.size() - assigned)
      << "}\n";

    o << "}\n";
    return o.str();
}

// ─────────────────────────────────────────────
//  MAIN — reads JSON from stdin, writes to stdout
//  Works both online (piped from Node.js)
//  and offline (piped from local file)
// ─────────────────────────────────────────────

int main() {
    // Read all stdin
    std::ostringstream buffer;
    buffer << std::cin.rdbuf();
    std::string input = buffer.str();

    if (input.empty()) {
        std::cerr << "{\"error\":\"No input provided\"}\n";
        return 1;
    }

    std::vector<DisasterZone> zones;
    std::vector<Volunteer>    volunteers;
    std::vector<Resource>     resources;

    // Parse zones
    for (auto& obj : splitJsonArray(input, "zones")) {
        DisasterZone z;
        z.id             = jsonGetString(obj, "id");
        z.name           = jsonGetString(obj, "name");
        z.coord.lat      = jsonGetDouble(obj, "lat");
        z.coord.lng      = jsonGetDouble(obj, "lng");
        z.severity       = static_cast<int>(jsonGetDouble(obj, "severity"));
        z.peopleAffected = static_cast<int>(jsonGetDouble(obj, "peopleAffected"));
        z.requiredSkill  = jsonGetString(obj, "requiredSkill");
        z.needsHelp      = jsonGetBool(obj, "needsHelp");
        if (z.needsHelp && z.id.empty()) z.needsHelp = false;
        z.calcPriority();
        if (!z.id.empty()) zones.push_back(z);
    }

    // Parse volunteers
    for (auto& obj : splitJsonArray(input, "volunteers")) {
        Volunteer v;
        v.id        = jsonGetString(obj, "id");
        v.name      = jsonGetString(obj, "name");
        v.coord.lat = jsonGetDouble(obj, "lat");
        v.coord.lng = jsonGetDouble(obj, "lng");
        v.skill     = jsonGetString(obj, "skill");
        v.available = jsonGetBool(obj, "available");
        v.assignedZoneId = "";
        if (!v.id.empty()) volunteers.push_back(v);
    }

    if (zones.empty() || volunteers.empty()) {
        std::cerr << "{\"error\":\"Need at least one zone and one volunteer\"}\n";
        return 1;
    }

    // Run greedy matching
    auto assignments = greedyMatch(zones, volunteers);

    // Output JSON result
    std::cout << buildOutput(zones, volunteers, assignments);
    return 0;
}