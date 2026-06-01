import sys
from linkedin_api import post_to_linkedin

message = "We are thrilled to announce our new Social Command Center now supports automated posting directly to LinkedIn using the official API! 🚀💼\n\n#Automation #B2B #Tech"
link = "https://techcrunch.com/"

print("Starting LinkedIn test post...")
success = post_to_linkedin(message=message, link=link)

if success:
    print("TEST POST WAS SUCCESSFUL!")
    sys.exit(0)
else:
    print("TEST POST FAILED!")
    sys.exit(1)
