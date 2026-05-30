import sys
from facebook_api import post_to_facebook

message = "We are thrilled to announce that our new Automated Command Center integration is now live and successfully publishing to Facebook using the official Graph API! 🤖🚀\n\n#Automation #Tech"
link = "https://techcrunch.com/"

print("Starting test post...")
success = post_to_facebook(message=message, link=link)

if success:
    print("TEST POST WAS SUCCESSFUL!")
    sys.exit(0)
else:
    print("TEST POST FAILED!")
    sys.exit(1)
