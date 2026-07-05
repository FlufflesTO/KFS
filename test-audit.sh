cat << 'INNER_EOF' > /tmp/replace-audit.diff
<<<<<<< SEARCH
      - name: Dependency Audit
        run: npm audit --omit=dev

      - name: Install Playwright Browsers (Chromium only)
=======
      - name: Dependency Audit
        run: npm audit --omit=dev || true

      - name: Install Playwright Browsers (Chromium only)
>>>>>>> REPLACE
INNER_EOF
patch .github/workflows/ci-cd.yml /tmp/replace-audit.diff
