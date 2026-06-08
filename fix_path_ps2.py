with open("scripts/build-deploy-artifacts.ps1", "r") as f:
    content = f.read()

content = content.replace(
    'throw "Portal artifact is missing server\\wrangler.json."',
    'throw "Portal artifact is missing server/wrangler.json."'
)

with open("scripts/build-deploy-artifacts.ps1", "w") as f:
    f.write(content)
