🛠️ Project Context Brief: "Global Domain Find"
Objective: Build a React + Node.js domain registration platform featuring an interactive, "unwrapped" (equirectangular) world map with live-simulated network pings.

1. API & Backend Configuration

Provider: Name.com API v1 (https://api.name.com/core/v1). 


Credentials: * Username: bjarvis.dex 


Auth Token: 438d606edc7c523b93e9f670da81adac7533beb0 


Encoded Header: Basic YmphcnZpcy5kZXg6NDM4ZDYwNmVkYzdjNTIzYjkzZTlmNjcwZGE4MWFkYWM3NTMzYmViMA== 

Key Services: Domain search, WHOIS Privacy protection, and RapidSSL upgrades.

2. Frontend: The "Cyber" Map Engine
Visual Style: Vector Simulation. Continent outlines and country borders (1px stroke) on a dark, high-contrast background.

Ping Animation Logic:

Max Concurrent: Strictly 2 active ping sequences at a time.

Sequence: Surface ripple (start) → Quadratic Bezier curve "Line of Light" → Surface ripple (target).

Interactive: Clicking an active ping shows a styled alt-text window with a public IP and 128x128 image.

Locations: 50 major global hubs (weighted heavily toward USA, Europe, Russia, Israel, Dubai, Taiwan, and Hong Kong).

3. TLD Inventory
The system must support and price the 470+ TLDs provided in the HTML dataframe, ranging from .ac, .academy, and .app to specialized extensions like .yokohama and .zone. 

4. Current Task List for CLI:
File Generation: Generate locations.json with lat/long for the 50 specified cities.

Logic Implementation: Build the usePingSystem.js hook (2-ping limit) and the Bezier drawing function for Canvas.

UI/UX: Create the floating "Cyber" search overlay and checkout flow (handling WHOIS/SSL toggles).

Deployment: Configure the Express proxy server to securely use the env.txt credentials for production.