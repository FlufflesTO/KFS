🧪 [capacity balancing] add tests for calculateOptimalTechnician

🎯 **What:** The calculateOptimalTechnician function lacked unit tests, creating a gap in validating the gating logic for assigning field technicians based on availability, certifications, and capacity.
📊 **Coverage:** Created robust test cases that cover checking for availability status, matching compliance/SAQCC certifications, validating working capacity limits (e.g., jobs not exceeding daily capacity load), and ensuring the lowest utilized technician is correctly prioritized among available eligible ones.
✨ **Result:** Improved confidence in the capacity-balancing algorithm, minimizing routing assignment errors and ensuring strict compliance with operational logic when processing job schedules.
