import urllib.request, json

# Test 1: taxonomy with q=python
url = "http://localhost:8000/api/v1/skills/taxonomy?q=python"
with urllib.request.urlopen(url) as r:
    data = json.loads(r.read())
print("TASK 1 - GET /api/v1/skills/taxonomy?q=python")
print(f"  total={data['total']}, categories={len(data['categories'])}")
for cat in data["categories"]:
    for sub in cat["subcategories"]:
        print(f"  [{cat['name']}] {sub['name']}: {sub['skills']}")
print()

# Test Task 1b: skill detail
url2 = "http://localhost:8000/api/v1/skills/python/detail"
with urllib.request.urlopen(url2) as r:
    detail = json.loads(r.read())
print("TASK 1 - GET /api/v1/skills/python/detail")
print(f"  canonical={detail['canonical']}, category={detail['category']}")
print(f"  subcategory={detail['subcategory']}, synonyms={detail['synonyms']}")
print(f"  related (first 5)={detail['related_skills'][:5]}")
print()

# Test Task 3: get candidate
c1 = "6d141fd8-d275-46cd-a015-03cd2b9251dc"
url3 = f"http://localhost:8000/api/v1/candidates/{c1}"
with urllib.request.urlopen(url3) as r:
    cand = json.loads(r.read())
print("TASK 3 - GET /api/v1/candidates/{id}")
pd = cand.get("parsed_data", {})
print(f"  name={pd.get('name')}, skills={pd.get('technical_skills', [])[:4]}")
print(f"  match_score={cand.get('match_score')}")
print()

# Test Task 2: compare
c2 = "655e82a0-02c7-4ede-ad0f-2302c6b5d2d3"
compare_body = json.dumps({
    "candidate_id_1": c1,
    "candidate_id_2": c2,
    "job_id": "senior_fullstack"
}).encode()
req = urllib.request.Request(
    "http://localhost:8000/api/v1/compare",
    data=compare_body,
    headers={"Content-Type": "application/json"},
    method="POST"
)
with urllib.request.urlopen(req) as r:
    cmp = json.loads(r.read())
print("TASK 2 - POST /api/v1/compare")
print(f"  job_title={cmp['job_title']}")
for c in cmp["candidates"]:
    print(f"  {c['name']}: score={c['overall_score']}, matched={c['matched_skills'][:3]}")
print(f"  winner={cmp['comparison']['winner']}")
print(f"  score_diff={cmp['comparison']['score_diff']}")
print(f"  recommendation: {cmp['comparison']['recommendation']}")
