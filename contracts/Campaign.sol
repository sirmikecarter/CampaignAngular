pragma solidity ^0.4.6;

contract Campaign {
    address public owner; // That is a state variable
    uint    public deadline;
    uint    public goal;
    uint    public fundsRaised;

    struct FunderStruct {
        uint amountContributed;
        uint amountRefunded;
        
    }
    
    mapping (address => FunderStruct) public funderStructs;
    
    event LogContribution(address sender, uint amount);
    event LogRefundSent(address funder, uint amount);
    event LogWithdrawal(address beneficiary, uint amount);
    
    modifier onlyMe () {
        if(msg.sender != owner) revert();
        _;
    }
    
    function Campaign(uint campaignDuration, uint campaignGoal){ // Constructor
        owner = msg.sender;
        deadline = block.number + campaignDuration;
        goal = campaignGoal;
    }

    function isSuccess() public constant returns(bool isIndeed){
        return(fundsRaised >= goal);
        
    }

    function hasFailed() public constant returns(bool hasIndeed){
        return(fundsRaised < goal && block.number > deadline);
    }


    function contribute() public payable returns(bool success) {
        
        if(msg.value==0) revert();
        if(isSuccess()) revert();
        if(hasFailed()) revert();
        fundsRaised += msg.value;
        funderStructs[msg.sender].amountContributed += msg.value;
        //funderStructs.push(newFunder);
        LogContribution(msg.sender, msg.value);
        return true;

    }
    
    function widthdrawFunds() public onlyMe() returns(bool success) {
        if(!isSuccess()) revert();
        uint amount = this.balance;
        owner.transfer(amount);
        LogWithdrawal(owner, amount);
        return true;
    }
    
    function requestRefund() public returns(bool success){
        uint amountOwed = funderStructs[msg.sender].amountContributed - funderStructs[msg.sender].amountRefunded;
        if(amountOwed == 0) revert();
        if(!hasFailed()) revert();
        funderStructs[msg.sender].amountRefunded += amountOwed;
        if(!msg.sender.send(amountOwed)) revert();
        LogRefundSent(msg.sender, amountOwed);
        return true;
    }
    
   /* function sendMeFunds() public onlyMe() returns(bool success) {
        if(refundsSent) revert();
        if (!hasFailed()) revert();
        
        uint funderCount = funderStructs.length;
        for(uint i=0; i<funderCount; i++){
            funderStructs[i].funder.transfer(funderStructs[i].amount);
            LogRefundSent(funderStructs[i].funder, funderStructs[i].amount);
        }
        refundsSent = true;
        return true;
    }
    */
    
    
    
}
